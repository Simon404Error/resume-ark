/**
 * 简历方舟 - 内容脚本
 * 检测招聘页面表单，注入浮动按钮，实现智能填写
 */

(function () {
  'use strict';

  // ========== 配置 ==========
  const FLOATING_BTN_ID = 'resume-ark-float-btn';
  const FLOATING_PANEL_ID = 'resume-ark-panel';
  const STYLE_ID = 'resume-ark-styles';

  let isInitialized = false;
  let formFields = [];
  let filledFields = {};

  // ========== 注入样式 ==========
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${FLOATING_BTN_ID} {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #4f46e5;
        color: white;
        border: none;
        cursor: pointer;
        z-index: 2147483647;
        box-shadow: 0 4px 16px rgba(79, 70, 229, 0.4);
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        opacity: 0;
        transform: scale(0.8);
      }
      #${FLOATING_BTN_ID}.visible {
        opacity: 1;
        transform: scale(1);
      }
      #${FLOATING_BTN_ID}:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 24px rgba(79, 70, 229, 0.6);
      }
      #${FLOATING_BTN_ID} .tooltip {
        position: absolute;
        right: 64px;
        background: #1a1a2e;
        color: #e4e4ef;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 13px;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
        border: 1px solid #2a2a44;
      }
      #${FLOATING_BTN_ID}:hover .tooltip {
        opacity: 1;
      }

      #${FLOATING_PANEL_ID} {
        position: fixed;
        bottom: 92px;
        right: 24px;
        width: 380px;
        max-height: 500px;
        background: #1a1a2e;
        border: 1px solid #2a2a44;
        border-radius: 16px;
        z-index: 2147483647;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        display: none;
        overflow: hidden;
        flex-direction: column;
        color: #e4e4ef;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
      }
      #${FLOATING_PANEL_ID}.open { display: flex; }

      .rak-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        border-bottom: 1px solid #2a2a44;
        background: #16162a;
      }
      .rak-panel-header h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
      }
      .rak-panel-close {
        background: none;
        border: none;
        color: #9494b8;
        cursor: pointer;
        font-size: 18px;
        padding: 4px;
      }
      .rak-panel-close:hover { color: #e4e4ef; }

      .rak-panel-body {
        padding: 16px;
        overflow-y: auto;
        flex: 1;
      }

      .rak-section { margin-bottom: 16px; }
      .rak-section-title {
        font-size: 12px;
        color: #9494b8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }

      .rak-field-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid rgba(42, 42, 68, 0.5);
      }
      .rak-field-row:last-child { border-bottom: none; }
      .rak-field-label { font-size: 13px; color: #9494b8; }
      .rak-field-status { font-size: 12px; }
      .rak-status-filled { color: #22c55e; }
      .rak-status-empty { color: #ef4444; }
      .rak-status-auto { color: #818cf8; }

      .rak-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
        width: 100%;
        justify-content: center;
      }
      .rak-btn-primary {
        background: #4f46e5;
        color: white;
      }
      .rak-btn-primary:hover { background: #4338ca; }
      .rak-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

      .rak-btn-secondary {
        background: transparent;
        color: #9494b8;
        border: 1px solid #2a2a44;
      }
      .rak-btn-secondary:hover { color: #e4e4ef; border-color: #9494b8; }

      .rak-status-bar {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        margin-bottom: 12px;
      }
      .rak-progress-bar {
        flex: 1;
        height: 4px;
        background: #2a2a44;
        border-radius: 2px;
        overflow: hidden;
      }
      .rak-progress-fill {
        height: 100%;
        background: #4f46e5;
        border-radius: 2px;
        transition: width 0.3s;
      }

      .rak-login-tip {
        text-align: center;
        padding: 20px;
      }
      .rak-login-tip p { margin-bottom: 12px; color: #9494b8; }

      .rak-loading {
        text-align: center;
        padding: 20px;
        color: #9494b8;
      }

      /* Resume preview */
      .rak-resume-preview {
        background: #0f0f1a;
        border: 1px solid #2a2a44;
        border-radius: 8px;
        padding: 12px;
        max-height: 160px;
        overflow-y: auto;
        font-size: 12px;
        line-height: 1.6;
        margin-bottom: 12px;
        white-space: pre-wrap;
      }
    `;
    document.head.appendChild(style);
  }

  // ========== 检测招聘网站表单 ==========
  function detectResumeForm() {
    // 检查页面是否包含简历表单特征
    const keywords = ['简历', 'resume', '求职意向', '教育经历', '工作经历', '项目经历',
      '期望薪资', '到岗时间', '自我评价', '附件简历', '上传简历'];

    const bodyText = document.body.innerText || '';

    // 检查页面文本是否包含简历关键词
    const hasResumeKeywords = keywords.some(k => bodyText.includes(k));

    // 查找表单元素
    const forms = document.querySelectorAll('form');
    const inputs = document.querySelectorAll('input, textarea, select');

    // 判断是否是简历表单的标准
    const hasFormFields = forms.length > 0 && inputs.length > 3;

    // 检查是否有文件上传用于简历
    const hasFileUpload = document.querySelector('input[type="file"]');

    if (hasResumeKeywords && (hasFormFields || hasFileUpload)) {
      return true;
    }

    // 更宽松的判断：URL 包含简历相关路径
    const url = window.location.href.toLowerCase();
    const urlKeywords = ['resume', '简历', 'apply', 'applyjob', 'candidate', 'register',
      'deliver', '投递', 'jobapplication'];
    if (urlKeywords.some(k => url.includes(k)) && hasFormFields) {
      return true;
    }

    return false;
  }

  // ========== 提取表单字段 ==========
  function extractFormFields() {
    const fields = [];
    const selectors = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])',
      'textarea',
      'select'
    ];

    document.querySelectorAll(selectors.join(',')).forEach(el => {
      const name = el.name || el.id || '';
      if (!name) return;

      // 获取标签
      let label = '';
      const labelEl = document.querySelector(`label[for="${el.id}"]`);
      if (labelEl) {
        label = labelEl.textContent.trim();
      } else {
        // 尝试从父元素找标签
        const parent = el.closest('.form-group, .field, .form-item, li, div');
        if (parent) {
          const possibleLabel = parent.querySelector('label, .label, .field-label');
          if (possibleLabel) label = possibleLabel.textContent.trim();
        }
      }

      // 获取 placeholder 作为备选标签
      const placeholder = el.placeholder || '';
      const displayLabel = label || placeholder || name;

      fields.push({
        name: name,
        label: displayLabel,
        type: el.tagName.toLowerCase() === 'textarea' ? 'textarea' :
              el.tagName.toLowerCase() === 'select' ? 'select' :
              (el.type || 'text'),
        selector: buildSelector(el),
        required: el.hasAttribute('required'),
        currentValue: el.value || ''
      });
    });

    return fields;
  }

  function buildSelector(el) {
    if (el.id) return `#${el.id}`;
    if (el.name) {
      const tag = el.tagName.toLowerCase();
      return `${tag}[name="${el.name}"]`;
    }
    // 基于 class
    const classes = Array.from(el.classList).slice(0, 2);
    if (classes.length) {
      return `${el.tagName.toLowerCase()}.${classes.join('.')}`;
    }
    return '';
  }

  // ========== 填充表单 ==========
  function fillFormFields(values) {
    let filledCount = 0;
    const totalFields = formFields.length;

    formFields.forEach(field => {
      const value = values[field.name] || values[field.label];
      if (!value) return;

      const el = document.querySelector(field.selector);
      if (!el) return;

      const tag = el.tagName.toLowerCase();

      if (tag === 'select') {
        // 尝试匹配选项
        const options = Array.from(el.options);
        const matched = options.find(opt =>
          opt.text.includes(value) || value.includes(opt.text) ||
          opt.value.includes(value) || value.includes(opt.value)
        );
        if (matched) {
          el.value = matched.value;
          el.dispatchEvent(new Event('change', { bubbles: true }));
          filledCount++;
        }
      } else if (tag === 'textarea' || (tag === 'input' && el.type !== 'file')) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        )?.set ||
        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;

        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(el, value);
        } else {
          el.value = value;
        }

        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        filledCount++;
      }
    });

    return { filled: filledCount, total: totalFields };
  }

  // ========== 创建浮动按钮 ==========
  function createFloatingButton() {
    if (document.getElementById(FLOATING_BTN_ID)) return;

    const btn = document.createElement('button');
    btn.id = FLOATING_BTN_ID;
    btn.innerHTML = `⚓<span class="tooltip">简历方舟 - 智能填写</span>`;

    btn.addEventListener('click', () => {
      togglePanel();
    });

    document.body.appendChild(btn);

    // 延迟显示动画
    requestAnimationFrame(() => {
      btn.classList.add('visible');
    });
  }

  // ========== 创建浮动面板 ==========
  let currentResumeId = null;

  async function togglePanel() {
    const panel = document.getElementById(FLOATING_PANEL_ID);
    if (!panel) {
      await createPanel();
    } else {
      const isOpen = panel.classList.contains('open');
      if (isOpen) {
        panel.classList.remove('open');
      } else {
        panel.classList.add('open');
        await refreshPanelContent();
      }
    }
  }

  async function createPanel() {
    const panel = document.createElement('div');
    panel.id = FLOATING_PANEL_ID;

    panel.innerHTML = `
      <div class="rak-panel-header">
        <h3>⚓ 简历方舟</h3>
        <button class="rak-panel-close" id="rak-panel-close">✕</button>
      </div>
      <div class="rak-panel-body" id="rak-panel-body">
        <div class="rak-loading">加载中...</div>
      </div>
    `;

    document.body.appendChild(panel);
    document.getElementById('rak-panel-close').addEventListener('click', () => {
      panel.classList.remove('open');
    });

    panel.classList.add('open');
    await refreshPanelContent();
  }

  async function refreshPanelContent() {
    const body = document.getElementById('rak-panel-body');
    if (!body) return;

    // 检查登录状态
    const loginRes = await chrome.runtime.sendMessage({ type: 'CHECK_LOGIN' });

    if (!loginRes.loggedIn) {
      body.innerHTML = `
        <div class="rak-login-tip">
          <p>请先登录简历方舟账号</p>
          <button class="rak-btn rak-btn-primary" id="rak-btn-login">前往登录</button>
        </div>
      `;
      document.getElementById('rak-btn-login')?.addEventListener('click', () => {
        window.open('http://localhost:5173/login', '_blank');
      });
      return;
    }

    // 已登录 - 显示填写界面
    formFields = extractFormFields();
    const filledBefore = formFields.filter(f => f.currentValue).length;

    body.innerHTML = `
      <div class="rak-section">
        <div class="rak-section-title">表单检测</div>
        <div class="rak-status-bar">
          <span>检测到 ${formFields.length} 个字段</span>
          <span style="color:#22c55e">✔</span>
        </div>
      </div>

      <div class="rak-section">
        <div class="rak-section-title">简历选择</div>
        <select id="rak-resume-select" class="rak-btn rak-btn-secondary" style="text-align:left;">
          <option value="">选择简历版本...</option>
        </select>
      </div>

      <div class="rak-section">
        <button class="rak-btn rak-btn-primary" id="rak-btn-fill">
          ▶ 一键智能填写
        </button>
      </div>

      <div class="rak-section">
        <button class="rak-btn rak-btn-secondary" id="rak-btn-optimize">
          🎯 专岗简历美化（可选）
        </button>
      </div>

      <div id="rak-fill-progress" style="display:none;">
        <div class="rak-section">
          <div class="rak-section-title">填写进度</div>
          <div class="rak-status-bar">
            <span id="rak-progress-text">0/${formFields.length}</span>
            <div class="rak-progress-bar">
              <div class="rak-progress-fill" id="rak-progress-fill" style="width:0%"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="rak-section" id="rak-result-section" style="display:none;">
        <div class="rak-section-title">填写结果</div>
        <div id="rak-result-content"></div>
      </div>
    `;

    // 获取简历列表
    try {
      const resumeRes = await chrome.runtime.sendMessage({ type: 'GET_RESUMES' });
      // 由于 background 没有 GET_RESUMES，暂不实现
    } catch (e) {
      // 暂时忽略
    }

    // 绑定填写按钮
    document.getElementById('rak-btn-fill')?.addEventListener('click', startAutoFill);
    document.getElementById('rak-btn-optimize')?.addEventListener('click', () => {
      // 打开优化引导页面
      window.open('http://localhost:5173/autofill', '_blank');
    });
  }

  // ========== 自动填写 ==========
  async function startAutoFill() {
    const progressSection = document.getElementById('rak-fill-progress');
    const resultSection = document.getElementById('rak-result-section');
    const btn = document.getElementById('rak-btn-fill');

    if (!btn) return;
    btn.disabled = true;
    btn.textContent = '⏳ 填写中...';
    progressSection.style.display = 'block';

    try {
      // 发送表单字段到后台进行 AI 匹配
      const res = await chrome.runtime.sendMessage({
        type: 'FILL_FORM',
        payload: {
          resumeId: currentResumeId,
          formFields: formFields.map(f => ({
            name: f.name,
            label: f.label,
            type: f.type,
            required: f.required
          })),
          pageUrl: window.location.href
        }
      });

      if (res.error) {
        showResult('error', res.error);
        return;
      }

      if (res.filledValues) {
        // 填充表单
        const result = fillFormFields(res.filledValues);

        // 更新进度
        const progress = result.filled / formFields.length * 100;
        document.getElementById('rak-progress-text').textContent =
          `${result.filled}/${formFields.length}`;
        document.getElementById('rak-progress-fill').style.width = `${progress}%`;

        // 显示结果
        const filledNames = Object.keys(res.filledValues);
        showResult('success',
          `成功填写 ${result.filled} 个字段！请检查以下字段：<br>
          ${filledNames.map(n => `✔ ${n}`).join('<br>')}`
        );

        // 更新字段状态
        formFields = extractFormFields();
      }
    } catch (err) {
      showResult('error', '填写失败：' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '▶ 一键智能填写';
    }
  }

  function showResult(type, message) {
    const section = document.getElementById('rak-result-section');
    const content = document.getElementById('rak-result-content');
    if (!section || !content) return;

    section.style.display = 'block';
    const color = type === 'success' ? '#22c55e' : '#ef4444';
    content.innerHTML = `<p style="color:${color};font-size:13px;">${message}</p>`;
  }

  // ========== 初始化 ==========
  function init() {
    if (isInitialized) return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(initCheck, 1000));
      return;
    }

    setTimeout(initCheck, 1500); // 等待页面完全加载
  }

  function initCheck() {
    if (isInitialized) return;

    const isResumeForm = detectResumeForm();
    if (!isResumeForm) return;

    isInitialized = true;
    injectStyles();
    createFloatingButton();

    console.log('⚓ 简历方舟：检测到简历表单，已注入智能填写功能');
  }

  // 启动
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }
})();