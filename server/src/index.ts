import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import resumeRouter from './routes/resume.js';
import campusRouter from './routes/campus.js';
import autofillRouter from './routes/autofill.js';
import { getDb } from './db/index.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// 中间件
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// API 路由
app.use('/api/auth', authRouter);
app.use('/api/resume', resumeRouter);
app.use('/api/campus', campusRouter);
app.use('/api/autofill', autofillRouter);

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 全局错误处理
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('未处理的错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 异步启动
async function start() {
  try {
    await getDb();
    console.log('✅ 数据库已初始化');
    
    app.listen(PORT, () => {
      console.log(`🚀 Resume Ark API 服务已启动: http://localhost:${PORT}`);
      console.log(`📋 API 路由:`);
      console.log(`   POST /api/auth/register     - 注册`);
      console.log(`   POST /api/auth/login        - 登录`);
      console.log(`   GET  /api/auth/me            - 获取当前用户`);
      console.log(`   POST /api/resume/upload      - 上传简历`);
      console.log(`   GET  /api/resume/list        - 简历列表`);
      console.log(`   GET  /api/campus/jobs        - 校招岗位列表`);
      console.log(`   GET  /api/campus/filters     - 筛选选项`);
      console.log(`   POST /api/autofill/fill      - 智能填充表单`);
    });
  } catch (err) {
    console.error('❌ 启动失败:', err);
    process.exit(1);
  }
}

start();