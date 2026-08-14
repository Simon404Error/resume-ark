/**
 * 数据库层 - 使用 sql.js (WebAssembly SQLite)
 * 无需原生编译，纯 JS 运行
 */
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.DB_PATH || './data/resume-ark.db';

let db: SqlJsDatabase | null = null;

export async function getDb(): Promise<SqlJsDatabase> {
  if (db) return db;

  const SQL = await initSqlJs();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 尝试加载已有数据库
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
  initSchema(db);
  return db;
}

function initSchema(database: SqlJsDatabase) {
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '未命名简历',
      version INTEGER NOT NULL DEFAULT 1,
      raw_text TEXT,
      parsed_json TEXT,
      file_path TEXT,
      file_type TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS resume_fields (
      id TEXT PRIMARY KEY,
      resume_id TEXT NOT NULL,
      field_key TEXT NOT NULL,
      field_value TEXT,
      field_category TEXT,
      FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS smart_memory (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      field_key TEXT NOT NULL,
      field_value TEXT,
      source TEXT DEFAULT 'manual',
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, field_key)
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS campus_jobs (
      id TEXT PRIMARY KEY,
      company TEXT NOT NULL,
      title TEXT NOT NULL,
      location TEXT,
      salary TEXT,
      deadline TEXT,
      job_type TEXT DEFAULT '校招',
      description TEXT,
      apply_url TEXT,
      source TEXT,
      tags TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS application_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company TEXT NOT NULL,
      position TEXT NOT NULL,
      status TEXT DEFAULT '已投递',
      apply_url TEXT,
      job_id TEXT,
      notes TEXT,
      applied_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
}

/** 保存数据库到磁盘 */
export function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

/** 关闭数据库 */
export function closeDb() {
  if (db) {
    saveDb();
    db.close();
    db = null;
  }
}

/** 工具：将 sql.js 查询结果转换为对象数组 */
export function rowsToObjects(stmt: import('sql.js').Statement): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free(); // 释放内存
  return results;
}

/** 工具：获取单行对象 */
export function rowToObject(stmt: import('sql.js').Statement): Record<string, unknown> | undefined {
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return undefined;
}