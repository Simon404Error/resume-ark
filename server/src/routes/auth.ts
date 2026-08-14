import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, saveDb, rowsToObjects, rowToObject } from '../db/index.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// 注册
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: '邮箱、密码、姓名为必填项' });
    }

    const db = await getDb();
    
    // 检查是否已存在
    const existing = db.exec(`SELECT id FROM users WHERE email = '${email.replace(/'/g, "''")}'`);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(409).json({ error: '该邮箱已注册' });
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 使用参数化查询避免 SQL 注入
    const stmt = db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)');
    stmt.bind([id, email, passwordHash, name]);
    stmt.step();
    stmt.free();
    saveDb();

    const token = jwt.sign({ userId: id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id, email, name } });
  } catch (err) {
    console.error('注册失败:', err);
    res.status(500).json({ error: '注册失败，请重试' });
  }
});

// 登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码为必填项' });
    }

    const db = await getDb();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    stmt.bind([email]);
    const user = rowToObject(stmt);

    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const valid = await bcrypt.compare(password, user.password_hash as string);
    if (!valid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ error: '登录失败，请重试' });
  }
});

// 获取当前用户信息
router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: '未登录' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const db = await getDb();
    const stmt = db.prepare('SELECT id, email, name, phone, created_at FROM users WHERE id = ?');
    stmt.bind([decoded.userId]);
    const user = rowToObject(stmt);
    
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json({ user });
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
});

// 更新个人信息
router.put('/profile', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: '未登录' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { name, phone } = req.body;
    const db = await getDb();
    
    const stmt = db.prepare("UPDATE users SET name = ?, phone = ?, updated_at = datetime('now') WHERE id = ?");
    stmt.bind([name || null, phone || null, decoded.userId]);
    stmt.step();
    stmt.free();
    saveDb();
    
    res.json({ message: '更新成功' });
  } catch {
    return res.status(401).json({ error: '登录已过期' });
  }
});

export default router;