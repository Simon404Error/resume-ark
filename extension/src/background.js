/**
 * 简历方舟 - 后台服务工作进程
 * 管理登录状态、消息转发、API 通信
 */

const API_BASE = 'http://localhost:3001/api';

// 监听来自 content-script 和 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'CHECK_LOGIN':
      checkLoginStatus().then(sendResponse);
      return true; // 保持消息通道开放

    case 'FILL_FORM':
      handleFillForm(message.payload).then(sendResponse);
      return true;

    case 'ANALYZE_FORM':
      handleAnalyzeForm(message.payload).then(sendResponse);
      return true;

    case 'SAVE_MEMORY':
      handleSaveMemory(message.payload).then(sendResponse);
      return true;

    case 'GET_MEMORIES':
      handleGetMemories().then(sendResponse);
      return true;

    case 'GET_RESUMES':
      handleGetResumes().then(sendResponse);
      return true;

    default:
      sendResponse({ error: '未知消息类型' });
      return false;
  }
});

async function getToken() {
  const result = await chrome.storage.local.get('token');
  return result.token || null;
}

async function checkLoginStatus() {
  const token = await getToken();
  if (!token) return { loggedIn: false };

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return { loggedIn: false };
    const data = await res.json();
    return { loggedIn: true, user: data.user };
  } catch {
    return { loggedIn: false };
  }
}

async function handleFillForm(payload) {
  const token = await getToken();
  if (!token) return { error: '未登录', needLogin: true };

  try {
    const res = await fetch(`${API_BASE}/autofill/fill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        resumeId: payload.resumeId,
        formFields: payload.formFields,
        pageUrl: payload.pageUrl
      })
    });
    return await res.json();
  } catch (err) {
    return { error: '网络错误，请重试' };
  }
}

async function handleAnalyzeForm(payload) {
  try {
    const res = await fetch(`${API_BASE}/autofill/analyze-form`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageHtml: payload.pageHtml,
        pageUrl: payload.pageUrl
      })
    });
    return await res.json();
  } catch (err) {
    return { error: '分析失败', formFields: [] };
  }
}

async function handleSaveMemory(payload) {
  const token = await getToken();
  if (!token) return { error: '未登录' };

  try {
    const res = await fetch(`${API_BASE}/autofill/save-memory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch {
    return { error: '保存失败' };
  }
}

async function handleGetResumes() {
  const token = await getToken();
  if (!token) return { resumes: [] };

  try {
    const res = await fetch(`${API_BASE}/resume/list`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { resumes: [] };
  }
}

async function handleGetMemories() {
  const token = await getToken();
  if (!token) return { memories: [] };

  try {
    const res = await fetch(`${API_BASE}/autofill/memories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { memories: [] };
  }
}