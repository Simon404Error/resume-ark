/**
 * 简历方舟 - 弹出窗口逻辑
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 检查登录状态
  const loginRes = await chrome.runtime.sendMessage({ type: 'CHECK_LOGIN' });

  const loginStatus = document.getElementById('login-status');
  const mainContent = document.getElementById('main-content');
  const loginPrompt = document.getElementById('login-prompt');

  if (loginRes.loggedIn) {
    loginStatus.style.display = 'none';
    mainContent.style.display = 'block';

    document.getElementById('user-name').textContent = loginRes.user?.name || '用户';

    // 退出按钮
    document.getElementById('btn-logout')?.addEventListener('click', async () => {
      await chrome.storage.local.remove('token');
      location.reload();
    });

    // 浮动按钮模式
    const floatMode = document.getElementById('float-mode');
    const saved = await chrome.storage.local.get('floatMode');
    if (saved.floatMode) floatMode.value = saved.floatMode;
    floatMode.addEventListener('change', async () => {
      await chrome.storage.local.set({ floatMode: floatMode.value });
      // 通知当前页面的 content-script
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'SET_FLOAT_MODE',
          mode: floatMode.value
        }).catch(() => {});
      }
    });

    // 检测当前页面
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const pageStatus = document.getElementById('page-status');
    if (tabs[0]) {
      const url = tabs[0].url || '';
      const isResumePage = /resume|简历|apply|投递|jobapplication|candidate/i.test(url);
      pageStatus.textContent = isResumePage
        ? '✅ 当前页面为招聘/简历页面'
        : 'ℹ️ 未检测到简历表单页面';
    } else {
      pageStatus.textContent = '无法获取页面信息';
    }
  } else {
    loginStatus.style.display = 'none';
    loginPrompt.style.display = 'block';
  }
});