<template>
  <div class="autofill-page">
    <h1 class="page-title">AI 智能填写网申简历</h1>
    <p class="page-desc">
      浏览器扩展 + AI 智能解析，自动填写企业招聘官网的简历表单
    </p>

    <!-- Status Card -->
    <div class="status-card card">
      <div class="status-icon">🧩</div>
      <div class="status-info">
        <h3>浏览器扩展</h3>
        <p>支持 Chrome 88+ 和 Edge 88+ 浏览器</p>
        <div class="status-tips">
          <span class="tag">自动识别表单</span>
          <span class="tag">一键填充</span>
          <span class="tag">智能记忆</span>
          <span class="tag">专岗优化</span>
        </div>
      </div>
    </div>

    <!-- Step-by-step guide -->
    <div class="guide-section">
      <h2 class="section-title">使用步骤</h2>

      <div class="step-card card">
        <div class="step-number">1</div>
        <div class="step-content">
          <h3>上传简历并解析</h3>
          <p>前往 <router-link to="/resume">简历管理</router-link> 页面，上传你的简历文件（支持 PDF、Word、TXT）。</p>
          <p>AI 将自动解析并提取你的个人信息、教育经历、工作经历等。</p>
        </div>
      </div>

      <div class="step-card card">
        <div class="step-number">2</div>
        <div class="step-content">
          <h3>安装浏览器扩展</h3>
          <p>根据你的浏览器选择安装方式：</p>
          <div class="extension-links">
            <a href="#" class="btn btn-primary" @click.prevent="showInstallGuide('chrome')">
              Chrome 扩展
            </a>
            <a href="#" class="btn btn-primary" @click.prevent="showInstallGuide('edge')">
              Edge 扩展
            </a>
          </div>
          <p class="install-note">安装后请登录简历方舟账号以同步简历数据</p>
        </div>
      </div>

      <div class="step-card card">
        <div class="step-number">3</div>
        <div class="step-content">
          <h3>进入目标公司招聘官网</h3>
          <p>打开你准备投递的企业招聘官网（如腾讯、阿里、字节等），登录该公司账号。</p>
          <p>选择心仪的岗位，点击"投递"进入简历填写页面。</p>
        </div>
      </div>

      <div class="step-card card">
        <div class="step-number">4</div>
        <div class="step-content">
          <h3>AI 自动填写</h3>
          <p>在简历填写页面，页面右下角会自动出现<strong>简历方舟浮动按钮</strong>。</p>
          <p>点击按钮展开后，点击"播放"按钮，AI 将自动扫描页面并填充表单字段。</p>
          <div class="feature-tips">
            <div class="tip">
              <span class="tip-icon">🎯</span>
              <span>可开启"专岗简历美化"，输入公司和岗位名，AI 针对性优化</span>
            </div>
            <div class="tip">
              <span class="tip-icon">📝</span>
              <span>可在预览区域直接修改简历内容，修改自动保存</span>
            </div>
            <div class="tip">
              <span class="tip-icon">🧠</span>
              <span>手动补充的字段会被 AI 智能记忆，下次自动填写</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Browser Install Modal -->
    <div v-if="installGuide" class="modal-overlay" @click="installGuide = ''">
      <div class="modal card" @click.stop>
        <button class="modal-close" @click="installGuide = ''">✕</button>
        <h2>{{ installGuide === 'chrome' ? 'Chrome 扩展安装' : 'Edge 扩展安装' }}</h2>

        <div class="install-steps">
          <div class="install-step">
            <h4>方式一：自动安装（推荐）</h4>
            <p v-if="installGuide === 'chrome'">
              访问 Chrome 网上应用店安装：
              <a :href="chromeStoreUrl" target="_blank" class="link">Chrome 扩展链接</a>
            </p>
            <p v-else>
              访问 Edge 加载项商店安装：
              <a :href="edgeStoreUrl" target="_blank" class="link">Edge 扩展链接</a>
            </p>
            <p class="note">自动安装版本支持自动更新，安全性更高。</p>
          </div>

          <div class="install-step">
            <h4>方式二：手动安装</h4>
            <ol>
              <li>从简历方舟下载扩展压缩包并解压</li>
              <li>在浏览器地址栏输入 <code>{{ installGuide === 'chrome' ? 'chrome://extensions' : 'edge://extensions' }}</code></li>
              <li>打开右上角的"开发者模式"</li>
              <li>将解压后的文件夹拖入扩展页面完成安装</li>
            </ol>
            <p class="note">手动安装版本无法自动更新，需定期下载最新版。</p>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="installGuide = ''">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const installGuide = ref('')
const chromeStoreUrl = 'https://chromewebstore.google.com/detail/resume-ark'
const edgeStoreUrl = 'https://microsoftedge.microsoft.com/addons/detail/resume-ark'

function showInstallGuide(browser: string) {
  installGuide.value = browser
}
</script>

<style scoped>
.status-card {
  display: flex; gap: 20px; align-items: flex-start; margin-bottom: 40px;
}
.status-icon { font-size: 48px; }
.status-info h3 { font-size: 20px; margin-bottom: 4px; }
.status-info p { color: var(--text-secondary); font-size: 14px; margin-bottom: 12px; }
.status-tips { display: flex; gap: 4px; flex-wrap: wrap; }

.section-title { font-size: 24px; font-weight: 700; margin-bottom: 20px; }

.guide-section { margin-bottom: 40px; }

.step-card {
  display: flex; gap: 20px; margin-bottom: 16px;
  transition: border-color 0.2s;
}
.step-card:hover { border-color: var(--primary); }

.step-number {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--primary); color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 700; flex-shrink: 0;
}

.step-content h3 { font-size: 18px; margin-bottom: 8px; }
.step-content p { font-size: 14px; color: var(--text-secondary); margin-bottom: 6px; }

.extension-links { display: flex; gap: 8px; margin: 12px 0; }
.install-note { font-size: 12px; color: var(--text-secondary); margin-top: 8px !important; }

.feature-tips { margin-top: 12px; }
.tip { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
.tip-icon { font-size: 16px; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal { max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative; }
.modal-close { position: absolute; top: 16px; right: 16px; background: none; border: none; color: var(--text-secondary); font-size: 20px; cursor: pointer; }
.modal h2 { margin-bottom: 20px; padding-right: 32px; }

.install-steps { margin-bottom: 16px; }
.install-step { margin-bottom: 20px; }
.install-step h4 { font-size: 16px; margin-bottom: 8px; color: var(--primary); }
.install-step p { font-size: 14px; color: var(--text-secondary); margin-bottom: 4px; }
.install-step ol { padding-left: 20px; font-size: 14px; color: var(--text-secondary); }
.install-step ol li { margin-bottom: 4px; }
.install-step code { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 13px; }
.note { font-size: 12px !important; color: var(--text-secondary); margin-top: 4px; }
.link { color: var(--primary); }
.modal-actions { margin-top: 16px; }
</style>