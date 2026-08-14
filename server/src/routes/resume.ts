import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { getDb, saveDb, rowsToObjects, rowToObject } from '../db/index.js';
import { parseResume, optimizeResume } from '../services/ai-service.js';
import fs from 'fs';
import path from 'path';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// 配置文件上传
const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    const dir = './uploads/resumes';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({
  storage,
  fileFilter: (_, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('仅支持 PDF/Word/TXT 格式'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

function getUserId(req: Request, res: Response): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) { res.status(401).json({ error: '未登录' }); return null; }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    res.status(401).json({ error: '登录已过期' }); return null;
  }
}

// 上传并解析简历
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: '请上传简历文件' });

    let rawText = '';
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.txt') {
      rawText = fs.readFileSync(file.path, 'utf-8');
    } else {
      rawText = `[文件: ${file.originalname}] 请使用专业解析工具处理此文件格式。`;
    }

    const db = await getDb();
    const resumeId = uuidv4();

    const insertStmt = db.prepare(
      'INSERT INTO resumes (id, user_id, name, raw_text, file_path, file_type) VALUES (?, ?, ?, ?, ?, ?)'
    );
    insertStmt.bind([resumeId, userId, file.originalname, rawText, file.path, ext]);
    insertStmt.step();
    insertStmt.free();

    let parsedData = null;
    try {
      if (rawText.length > 20) {
        parsedData = await parseResume(rawText);
        const updateStmt = db.prepare('UPDATE resumes SET parsed_json = ? WHERE id = ?');
        updateStmt.bind([JSON.stringify(parsedData), resumeId]);
        updateStmt.step();
        updateStmt.free();

        if (parsedData) {
          const insertField = db.prepare(
            'INSERT INTO resume_fields (id, resume_id, field_key, field_value, field_category) VALUES (?, ?, ?, ?, ?)'
          );
          for (const [key, value] of Object.entries(parsedData)) {
            const fieldValue = typeof value === 'string' ? value : JSON.stringify(value);
            insertField.bind([uuidv4(), resumeId, key, fieldValue, 'parsed']);
            insertField.step();
          }
          insertField.free();
        }
      }
    } catch (aiErr) {
      console.error('AI 解析失败:', aiErr);
    }

    saveDb();

    res.json({
      resumeId,
      fileName: file.originalname,
      parsed: !!parsedData,
      parsedData
    });
  } catch (err) {
    console.error('上传失败:', err);
    res.status(500).json({ error: '上传失败，请重试' });
  }
});

// 获取用户的简历列表
router.get('/list', async (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  const db = await getDb();
  const stmt = db.prepare(
    "SELECT id, name, version, file_type, parsed_json IS NOT NULL as is_parsed, created_at, updated_at FROM resumes WHERE user_id = ? ORDER BY updated_at DESC"
  );
  stmt.bind([userId]);
  const rows = rowsToObjects(stmt);

  res.json({ resumes: rows });
});

// 获取简历详情
router.get('/:id', async (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?');
  stmt.bind([req.params.id, userId]);
  const resume = rowToObject(stmt);

  if (!resume) return res.status(404).json({ error: '简历不存在' });

  let parsedData = null;
  if (resume.parsed_json) {
    try { parsedData = JSON.parse(resume.parsed_json as string); } catch { /* ignore */ }
  }

  res.json({ resume: { ...resume, parsedData } });
});

// 删除简历
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  const db = await getDb();
  const stmt = db.prepare('SELECT file_path FROM resumes WHERE id = ? AND user_id = ?');
  stmt.bind([req.params.id, userId]);
  const resume = rowToObject(stmt);

  if (!resume) return res.status(404).json({ error: '简历不存在' });

  if (resume.file_path && fs.existsSync(resume.file_path as string)) {
    fs.unlinkSync(resume.file_path as string);
  }

  const delStmt = db.prepare('DELETE FROM resumes WHERE id = ?');
  delStmt.bind([req.params.id]);
  delStmt.step();
  delStmt.free();
  saveDb();

  res.json({ message: '删除成功' });
});

// AI 优化简历
router.post('/optimize', async (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  const { resumeId, companyName, positionName } = req.body;
  if (!resumeId || !companyName || !positionName) {
    return res.status(400).json({ error: '简历ID、公司名、岗位名为必填项' });
  }

  try {
    const db = await getDb();
    const stmt = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?');
    stmt.bind([resumeId, userId]);
    const resume = rowToObject(stmt);

    if (!resume) return res.status(404).json({ error: '简历不存在' });

    const resumeText = (resume.raw_text as string) || (resume.parsed_json as string) || '';
    const optimized = await optimizeResume(resumeText, companyName, positionName);

    res.json({ optimized });
  } catch (err) {
    console.error('优化失败:', err);
    res.status(500).json({ error: '优化失败，请重试' });
  }
});

export default router;