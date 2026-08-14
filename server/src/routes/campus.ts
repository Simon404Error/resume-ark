import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { getDb, saveDb, rowsToObjects, rowToObject } from '../db/index.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

function getUserId(req: Request, res: Response): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) { res.status(401).json({ error: '请先登录' }); return null; }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    res.status(401).json({ error: '登录已过期' }); return null;
  }
}

/** 构建参数化查询的 WHERE 子句 */
function buildWhereClause(filters: Record<string, string | undefined>): { clause: string; params: unknown[] } {
  const conditions: string[] = ['is_active = 1'];
  const params: unknown[] = [];

  if (filters.keyword) {
    conditions.push('(title LIKE ? OR company LIKE ? OR description LIKE ?)');
    params.push(`%${filters.keyword}%`, `%${filters.keyword}%`, `%${filters.keyword}%`);
  }
  if (filters.jobType) {
    conditions.push('job_type = ?');
    params.push(filters.jobType);
  }
  if (filters.location) {
    conditions.push('location LIKE ?');
    params.push(`%${filters.location}%`);
  }
  if (filters.company) {
    conditions.push('company LIKE ?');
    params.push(`%${filters.company}%`);
  }

  return { clause: conditions.length ? 'WHERE ' + conditions.join(' AND ') : '', params };
}

// 获取校招/实习岗位列表
router.get('/jobs', async (req: Request, res: Response) => {
  const db = await getDb();
  const {
    page = '1', pageSize = '20', keyword = '', jobType = '', location = '', company = ''
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const size = Math.min(50, Math.max(1, parseInt(pageSize) || 20));
  const offset = (pageNum - 1) * size;

  const { clause, params } = buildWhereClause({ keyword, jobType, location, company });

  // 获取总数
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM campus_jobs ${clause}`);
  countStmt.bind(params);
  const countRow = rowToObject(countStmt);
  const total = (countRow?.total as number) || 0;

  // 获取分页数据
  const dataStmt = db.prepare(
    `SELECT id, company, title, location, salary, deadline, job_type, tags, source, created_at
     FROM campus_jobs ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  );
  dataStmt.bind([...params, size, offset]);
  const jobs = rowsToObjects(dataStmt);

  res.json({
    jobs,
    pagination: { page: pageNum, pageSize: size, total, totalPages: Math.ceil(total / size) }
  });
});

// 获取岗位详情
router.get('/jobs/:id', async (req: Request, res: Response) => {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM campus_jobs WHERE id = ?');
  stmt.bind([req.params.id]);
  const job = rowToObject(stmt);
  if (!job) return res.status(404).json({ error: '岗位不存在' });
  res.json({ job });
});

// 获取筛选选项
router.get('/filters', async (_req: Request, res: Response) => {
  const db = await getDb();

  const companies = rowsToObjects(
    db.prepare('SELECT DISTINCT company FROM campus_jobs WHERE is_active = 1 ORDER BY company')
  ).map(r => r.company as string).filter(Boolean);

  const locations = rowsToObjects(
    db.prepare("SELECT DISTINCT location FROM campus_jobs WHERE is_active = 1 AND location != '' ORDER BY location")
  ).map(r => r.location as string).filter(Boolean);

  const jobTypes = rowsToObjects(
    db.prepare('SELECT DISTINCT job_type FROM campus_jobs WHERE is_active = 1 ORDER BY job_type')
  ).map(r => r.job_type as string).filter(Boolean);

  const tagsRows = rowsToObjects(
    db.prepare("SELECT DISTINCT tags FROM campus_jobs WHERE is_active = 1 AND tags != ''")
  );

  const allTags = new Set<string>();
  tagsRows.forEach(r => {
    if (r.tags) (r.tags as string).split(',').forEach(tag => allTags.add(tag.trim()));
  });

  res.json({ companies, locations, jobTypes, tags: Array.from(allTags) });
});

// 批量导入岗位数据
router.post('/jobs/import', async (req: Request, res: Response) => {
  const { jobs } = req.body as { jobs: Array<Record<string, string>> };
  if (!jobs || !Array.isArray(jobs)) {
    return res.status(400).json({ error: '请提供岗位数据数组' });
  }

  const db = await getDb();
  const insertStmt = db.prepare(
    `INSERT OR REPLACE INTO campus_jobs
      (id, company, title, location, salary, deadline, job_type, description, apply_url, source, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  let count = 0;
  for (const job of jobs) {
    insertStmt.bind([
      job.id || uuidv4(), job.company || '', job.title || '', job.location || '',
      job.salary || '', job.deadline || '', job.job_type || '校招',
      job.description || '', job.apply_url || '', job.source || '', job.tags || ''
    ]);
    insertStmt.step();
    count++;
  }
  insertStmt.free();
  saveDb();

  res.json({ message: `成功导入 ${count} 条岗位数据` });
});

// 获取投递记录
router.get('/applications', async (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM application_records WHERE user_id = ? ORDER BY applied_at DESC');
  stmt.bind([userId]);
  const applications = rowsToObjects(stmt);

  res.json({ applications });
});

// 添加投递记录
router.post('/applications', async (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  const { company, position, applyUrl, jobId } = req.body;
  if (!company || !position) {
    return res.status(400).json({ error: '公司和岗位为必填项' });
  }

  const db = await getDb();
  const id = uuidv4();
  const stmt = db.prepare(
    'INSERT INTO application_records (id, user_id, company, position, apply_url, job_id) VALUES (?, ?, ?, ?, ?, ?)'
  );
  stmt.bind([id, userId, company, position, applyUrl || '', jobId || '']);
  stmt.step();
  stmt.free();
  saveDb();

  res.status(201).json({ id, message: '添加成功' });
});

// 更新投递状态
router.put('/applications/:id', async (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  const { status, notes } = req.body;
  const db = await getDb();
  const stmt = db.prepare(
    "UPDATE application_records SET status = ?, notes = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?"
  );
  stmt.bind([status || '已投递', notes || '', req.params.id, userId]);
  stmt.step();
  stmt.free();
  saveDb();

  res.json({ message: '更新成功' });
});

// 删除投递记录
router.delete('/applications/:id', async (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  const db = await getDb();
  const stmt = db.prepare('DELETE FROM application_records WHERE id = ? AND user_id = ?');
  stmt.bind([req.params.id, userId]);
  stmt.step();
  stmt.free();
  saveDb();

  res.json({ message: '删除成功' });
});

export default router;