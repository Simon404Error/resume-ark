# ⚓ 简历方舟 (Resume Ark)

> **⚠️ 留档，以后有机会再完善**
> **⚠️ 声明：这仅是一具空壳，不具备实际用途。**
>
> - ❌ 未接入真实 AI API
> - ❌ 浏览器扩展未签名
> - ❌ 校招数据仅为示例
> - ❌ 简历解析仅支持纯文本格式

---

## 项目结构

```
resume-ark/
├── server/          # 后端 API（Express + TypeScript + SQLite）
│   ├── src/
│   │   ├── routes/        # API 路由
│   │   │   ├── auth.ts        # 认证
│   │   │   ├── resume.ts      # 简历管理
│   │   │   ├── campus.ts      # 校招数据
│   │   │   └── autofill.ts    # 智能填写
│   │   ├── services/
│   │   │   └── ai-service.ts  # AI 集成（需 API Key）
│   │   └── db/
│   │       └── index.ts       # SQLite 数据库
│   └── package.json
├── web/             # 前端 Vue 3 应用
│   ├── src/views/
│   │   ├── Home.vue           # 首页
│   │   ├── CampusTable.vue    # 校招汇总表
│   │   ├── ResumeManage.vue   # 简历管理
│   │   ├── AutofillGuide.vue  # 智能填写引导
│   │   ├── Applications.vue   # 投递记录
│   │   └── Login.vue          # 登录/注册
│   └── package.json
├── extension/       # 浏览器扩展（Chrome/Edge Manifest V3）
│   ├── manifest.json
│   ├── src/
│   │   ├── background.js      # 后台服务
│   │   ├── content-script.js  # 表单检测与填充
│   │   ├── inject.js          # 页面注入
│   │   └── popup/             # 弹出窗口
│   └── icons/
└── README.md
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Pinia + Vue Router |
| 后端 | Node.js + Express + TypeScript |
| 数据库 | SQLite (sql.js WASM) |

## 快速开始

```bash
# 安装依赖
cd server && npm install
cd web && npm install

# 配置 AI（可选，不配也不影响页面展示）
# 编辑 server/.env，填入你的 DeepSeek API Key
# DEEPSEEK_API_KEY=sk-xxxxxxxx

# 导入校招示例数据
cd server && npx tsx src/seed.ts

# 启动后端 (端口 3001)
cd server && npm run dev

# 启动前端 (端口 5173)
cd web && npm run dev
```

## 浏览器扩展开发模式加载

1. 打开 Chrome/Edge，访问 `chrome://extensions`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展」，选择 `extension/` 目录

## License

MIT
