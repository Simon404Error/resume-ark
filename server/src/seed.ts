/**
 * 种子数据脚本 - 向校招岗位表插入示例数据
 * 运行: npx tsx src/seed.ts
 */
import 'dotenv/config';
import { getDb, saveDb, closeDb } from './db/index.js';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  const db = await getDb();

  // 清空已有数据
  db.run('DELETE FROM campus_jobs');

  const jobs = [
    { company: '腾讯', title: '后端开发工程师', location: '深圳', salary: '20K-40K·16薪', deadline: '2026-09-30', job_type: '校招', tags: '互联网,大厂', apply_url: 'https://join.qq.com' },
    { company: '阿里巴巴', title: '前端开发工程师', location: '杭州', salary: '18K-35K·16薪', deadline: '2026-09-15', job_type: '校招', tags: '互联网,大厂', apply_url: 'https://talent.alibaba.com' },
    { company: '字节跳动', title: '算法工程师', location: '北京', salary: '25K-50K·15薪', deadline: '2026-08-31', job_type: '校招', tags: '互联网,大厂', apply_url: 'https://job.bytedance.com' },
    { company: '美团', title: '产品经理', location: '北京', salary: '15K-30K·15薪', deadline: '2026-10-15', job_type: '校招', tags: '互联网,大厂', apply_url: 'https://campus.meituan.com' },
    { company: '百度', title: '测试开发工程师', location: '北京', salary: '16K-32K·16薪', deadline: '2026-09-20', job_type: '校招', tags: '互联网,大厂', apply_url: 'https://talent.baidu.com' },
    { company: '京东', title: 'Java开发工程师', location: '北京', salary: '18K-36K·16薪', deadline: '2026-10-01', job_type: '校招', tags: '互联网,大厂', apply_url: 'https://campus.jd.com' },
    { company: '网易', title: '游戏策划', location: '广州', salary: '15K-30K·16薪', deadline: '2026-09-10', job_type: '校招', tags: '互联网,游戏', apply_url: 'https://hr.163.com' },
    { company: '小红书', title: '数据分析师', location: '上海', salary: '15K-28K·15薪', deadline: '2026-09-25', job_type: '校招', tags: '互联网,社区', apply_url: 'https://job.xiaohongshu.com' },
    { company: '哔哩哔哩', title: '客户端开发工程师', location: '上海', salary: '16K-32K·15薪', deadline: '2026-09-30', job_type: '校招', tags: '互联网,视频', apply_url: 'https://jobs.bilibili.com' },
    { company: '快手', title: '推荐算法工程师', location: '北京', salary: '22K-45K·16薪', deadline: '2026-09-15', job_type: '校招', tags: '互联网,大厂', apply_url: 'https://zhaopin.kuaishou.cn' },
    { company: '华为', title: '通信算法工程师', location: '深圳', salary: '20K-40K·14薪', deadline: '2026-12-31', job_type: '校招', tags: '通信,大厂', apply_url: 'https://career.huawei.com' },
    { company: '小米', title: '嵌入式软件工程师', location: '北京', salary: '16K-32K·14薪', deadline: '2026-10-31', job_type: '校招', tags: '智能硬件,大厂', apply_url: 'https://hr.xiaomi.com' },
    { company: '比亚迪', title: '智能驾驶算法工程师', location: '深圳', salary: '18K-35K·13薪', deadline: '2026-11-30', job_type: '校招', tags: '汽车,新能源', apply_url: 'https://job.byd.com' },
    { company: '蔚来', title: '车载系统开发工程师', location: '上海', salary: '20K-40K·14薪', deadline: '2026-10-15', job_type: '校招', tags: '汽车,新能源', apply_url: 'https://nio.com/careers' },
    { company: '拼多多', title: '服务端开发工程师', location: '上海', salary: '22K-45K·16薪', deadline: '2026-09-01', job_type: '校招', tags: '互联网,大厂', apply_url: 'https://careers.pinduoduo.com' },
    { company: '商汤科技', title: '计算机视觉研究员', location: '北京', salary: '25K-50K·14薪', deadline: '2026-10-30', job_type: '校招', tags: 'AI,大厂', apply_url: 'https://hr.sensetime.com' },
    { company: '科大讯飞', title: 'NLP算法工程师', location: '合肥', salary: '15K-30K·14薪', deadline: '2026-11-15', job_type: '校招', tags: 'AI,大厂', apply_url: 'https://www.iflytek.com/careers' },
    { company: '腾讯', title: '后端开发实习生', location: '深圳', salary: '200-300/天', deadline: '2026-08-31', job_type: '实习', tags: '互联网,大厂', apply_url: 'https://join.qq.com' },
    { company: '字节跳动', title: '产品经理实习生', location: '北京', salary: '200-400/天', deadline: '2026-09-15', job_type: '实习', tags: '互联网,大厂', apply_url: 'https://job.bytedance.com' },
    { company: '阿里巴巴', title: '数据分析实习生', location: '杭州', salary: '200-350/天', deadline: '2026-09-01', job_type: '实习', tags: '互联网,大厂', apply_url: 'https://talent.alibaba.com' },
    { company: '美团', title: '机器学习实习生', location: '北京', salary: '250-400/天', deadline: '2026-10-01', job_type: '实习', tags: '互联网,大厂', apply_url: 'https://campus.meituan.com' },
    { company: '华为', title: 'AI工程师实习生', location: '深圳', salary: '300-500/天', deadline: '2026-12-31', job_type: '实习', tags: '通信,大厂', apply_url: 'https://career.huawei.com' },
    { company: '猿辅导', title: '后端开发工程师（内推）', location: '北京', salary: '18K-35K·14薪', deadline: '2026-09-30', job_type: '内推', tags: '教育,内推', apply_url: '#' },
    { company: '得物', title: '前端开发工程师（内推）', location: '上海', salary: '16K-30K·15薪', deadline: '2026-09-20', job_type: '内推', tags: '电商,内推', apply_url: '#' },
    { company: '旷视科技', title: '计算机视觉工程师（内推）', location: '北京', salary: '20K-40K·14薪', deadline: '2026-10-15', job_type: '内推', tags: 'AI,内推', apply_url: '#' },
  ];

  const insertStmt = db.prepare(
    'INSERT INTO campus_jobs (id, company, title, location, salary, deadline, job_type, apply_url, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  let count = 0;
  for (const job of jobs) {
    insertStmt.bind([uuidv4(), job.company, job.title, job.location, job.salary, job.deadline, job.job_type, job.apply_url, job.tags]);
    insertStmt.step();
    count++;
  }
  insertStmt.free();
  saveDb();

  console.log(`✅ 已插入 ${count} 条校招岗位示例数据`);
  closeDb();
}

main().catch(err => {
  console.error('种子数据插入失败:', err);
  process.exit(1);
});