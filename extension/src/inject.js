/**
 * 简历方舟 - 注入脚本
 * 通过 web_accessible_resources 注入到页面上下文
 * 用于处理一些 content-script 无法直接访问的页面变量
 */

(function () {
  'use strict';

  // 监听来自 content-script 的消息
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data.type === 'RESUME_ARK_GET_FORM_DATA') {
      // 尝试从页面 JS 变量中获取表单数据
      const formData = {};

      // 检查常见的 Vue/React 表单数据
      if (window.__NUXT__?.state) {
        formData.nuxtState = window.__NUXT__.state;
      }
      if (window.__INITIAL_STATE__) {
        formData.initialState = window.__INITIAL_STATE__;
      }
      if (window.__PRELOADED_STATE__) {
        formData.preloadedState = window.__PRELOADED_STATE__;
      }

      window.postMessage({
        type: 'RESUME_ARK_FORM_DATA',
        data: formData
      }, '*');
    }
  });

  console.log('⚓ 简历方舟注入脚本已加载');
})();