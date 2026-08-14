<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">AI 智能填写网申简历</h1>
        <p class="hero-desc">
          上传简历后，AI 自动解析并智能填写各大公司招聘官网表单。<br>
          将 30 分钟的投递时间缩短到 3 分钟。
        </p>
        <div class="hero-actions">
          <router-link to="/autofill" class="btn btn-primary btn-lg">开始使用</router-link>
          <router-link to="/campus" class="btn btn-secondary btn-lg">查看校招信息</router-link>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features">
      <h2 class="section-title">核心功能</h2>
      <div class="features-grid">
        <div class="feature-card card">
          <div class="feature-icon">📄</div>
          <h3>简历一键解析</h3>
          <p>上传 PDF/Word/TXT 简历，AI 自动提取姓名、学历、工作经历等信息，无需手动填写。</p>
        </div>
        <div class="feature-card card">
          <div class="feature-icon">🔍</div>
          <h3>智能识别表单</h3>
          <p>自动识别企业招聘官网的简历表单字段，精准匹配并一键填充。</p>
        </div>
        <div class="feature-card card">
          <div class="feature-icon">🎯</div>
          <h3>专岗简历优化</h3>
          <p>根据目标公司和岗位，AI 针对性地优化简历内容，提升投递通过率。</p>
        </div>
        <div class="feature-card card">
          <div class="feature-icon">🧠</div>
          <h3>智能记忆填写</h3>
          <p>简历之外的字段只需填写一次，系统自动学习记忆，越用越聪明。</p>
        </div>
        <div class="feature-card card">
          <div class="feature-icon">📊</div>
          <h3>校招汇总表</h3>
          <p>汇总各大公司校招、实习、内推信息，支持搜索筛选，不错过任何机会。</p>
        </div>
        <div class="feature-card card">
          <div class="feature-icon">📋</div>
          <h3>投递进度管理</h3>
          <p>记录每一份投递的状态，从已投递到面试到 Offer，全程跟踪。</p>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="how-it-works">
      <h2 class="section-title">如何使用</h2>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <h3>上传简历</h3>
          <p>在简历管理页上传你的简历文件（PDF/Word/TXT）</p>
        </div>
        <div class="step-arrow">→</div>
        <div class="step">
          <div class="step-number">2</div>
          <h3>安装扩展</h3>
          <p>安装浏览器扩展，登录简历方舟账号</p>
        </div>
        <div class="step-arrow">→</div>
        <div class="step">
          <div class="step-number">3</div>
          <h3>打开目标官网</h3>
          <p>进入企业招聘官网，选择岗位进入简历填写页面</p>
        </div>
        <div class="step-arrow">→</div>
        <div class="step">
          <div class="step-number">4</div>
          <h3>一键填充</h3>
          <p>点击浮动按钮，AI 自动识别并填写所有表单字段</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.hero {
  text-align: center; padding: 80px 0 60px;
  background: linear-gradient(180deg, rgba(79,70,229,0.1) 0%, transparent 100%);
  border-radius: 24px; margin-bottom: 60px;
}

.hero-title {
  font-size: 42px; font-weight: 800;
  background: linear-gradient(135deg, #818cf8, #a78bfa);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  margin-bottom: 16px;
}

.hero-desc { font-size: 18px; color: var(--text-secondary); margin-bottom: 32px; }

.hero-actions { display: flex; gap: 12px; justify-content: center; }

.btn-lg { padding: 14px 32px; font-size: 16px; }

.section-title {
  font-size: 28px; font-weight: 700; text-align: center;
  margin-bottom: 40px;
}

.features-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
  margin-bottom: 60px;
}

.feature-card { text-align: center; padding: 32px 24px; }
.feature-icon { font-size: 40px; margin-bottom: 16px; }
.feature-card h3 { font-size: 18px; margin-bottom: 8px; }
.feature-card p { font-size: 14px; color: var(--text-secondary); line-height: 1.7; }

.how-it-works { margin-bottom: 60px; }

.steps {
  display: flex; align-items: center; justify-content: center; gap: 16px;
}

.step { text-align: center; max-width: 200px; }
.step-number {
  width: 48px; height: 48px; border-radius: 50%;
  background: var(--primary); color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 700; margin: 0 auto 12px;
}
.step h3 { font-size: 16px; margin-bottom: 6px; }
.step p { font-size: 13px; color: var(--text-secondary); }

.step-arrow { font-size: 24px; color: var(--text-secondary); margin-bottom: 30px; }

@media (max-width: 768px) {
  .features-grid { grid-template-columns: 1fr; }
  .steps { flex-direction: column; }
  .step-arrow { transform: rotate(90deg); }
}
</style>