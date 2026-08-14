import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getDb, saveDb, rowsToObjects, rowToObject } from '../db/index.js';
import { generateFieldValues, analyzeFormStructure } from '../services/ai-service.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

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

/**
 * 获取智能填充数据
 */
router.post('/fill', async (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  try {
    const { resumeId, formFields, pageUrl } = req.body;
    if (!formFields || !Array.isArray(formFields)) {
      return res.status(400).json({ error: '请提供表单字段列表' });
    }

    const db = await getDb();

    let resumeData = null;
    if (resumeId) {
      const stmt = db.prepare('SELECT parsed_json FROM resumes WHERE id = ? AND user_id = ?');
      stmt.bind([resumeId, userId]);
      const resume = rowToObject(stmt);
      if (resume?.parsed_json) {
        resumeData = JSON.parse(resume.parsed_json as string);
      }
    }

    const memStmt = db.prepare('SELECT field_key, field_value FROM smart_memory WHERE user_id = ?');
    memStmt.bind([userId]);
    const memories = rowsToObjects(memStmt);
    const smartMemory: Record<string, string> = {};
    memories.forEach(m => { smartMemory[m.field_key as string] = (m.field_value as string) || ''; });

    const filledValues = await generateFieldValues(
      resumeData || {},
      formFields,
      smartMemory
    );

    res.json({ filledValues });
  } catch (err) {
    console.error('智能填充失败:', err);
    res.status(500).json({ error: '填充失败，请重试' });
  }
});

/**
 * 分析页面表单结构
 */
router.post('/analyze-form', async (req: Request, res: Response) => {
  try {
    const { pageHtml, pageUrl } = req.body;
    if (!pageHtml) {
      return res.status(400).json({ error: '请提供页面 HTML' });
    }

    const formFields = await analyzeFormStructure(pageHtml, pageUrl);
    res.json({ formFields });
  } catch (err) {
    console.error('表单分析失败:', err);
    res.status(500).json({ error: '分析失败', formFields: [] });
  }
});

/**
 * 保存智能记忆
 */
router.post('/save-memory', async (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  const { fieldKey, fieldValue } = req.body;
  if (!fieldKey) return res.status(400).json({ error: 'fieldKey 必填' });

  const db = await getDb();
  const stmt = db.prepare(
    "INSERT OR REPLACE INTO smart_memory (id, user_id, field_key, field_value, source, updated_at) VALUES (?, ?, ?, ?, 'manual', datetime('now'))"
  );
  stmt.bind([crypto.randomUUID(), userId, fieldKey, fieldValue || '']);
  stmt.step();
  stmt.free();
  saveDb();

  res.json({ message: '已记忆' });
});

/**
 * 获取用户的智能记忆
 */
router.get('/memories', async (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  const db = await getDb();
  const stmt = db.prepare('SELECT field_key, field_value, updated_at FROM smart_memory WHERE user_id = ? ORDER BY updated_at DESC');
  stmt.bind([userId]);
  const memories = rowsToObjects(stmt);

  res.json({ memories });
});

export default router;