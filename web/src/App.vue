<template>
  <div class="app">
    <nav class="nav-bar">
      <div class="nav-inner">
        <router-link to="/" class="nav-logo">
          <span class="logo-icon">⚓</span>
          <span class="logo-text">简历方舟</span>
        </router-link>
        <div class="nav-links">
          <router-link to="/campus" class="nav-link">校招汇总</router-link>
          <router-link to="/resume" class="nav-link">简历管理</router-link>
          <router-link to="/autofill" class="nav-link">智能填写</router-link>
          <router-link v-if="userStore.isLoggedIn" to="/applications" class="nav-link">投递记录</router-link>
        </div>
        <div class="nav-user">
          <template v-if="userStore.isLoggedIn">
            <span class="user-name">{{ userStore.userName }}</span>
            <button class="btn-logout" @click="handleLogout">退出</button>
          </template>
          <router-link v-else to="/login" class="btn-login">登录</router-link>
        </div>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
    <footer class="footer">
      <div class="footer-inner">
        <p>简历方舟 - AI 智能填写网申简历 | 校招汇总表</p>
        <p class="footer-sub">基于 DeepSeek AI 技术，让你的求职更高效</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from './stores/user'

const router = useRouter()
const userStore = useUserStore()

function handleLogout() {
  userStore.logout()
  router.push('/')
}
</script>

<style>
:root {
  --primary: #4f46e5;
  --primary-dark: #4338ca;
  --bg: #0f0f1a;
  --bg-card: #1a1a2e;
  --bg-nav: #16162a;
  --text: #e4e4ef;
  --text-secondary: #9494b8;
  --border: #2a2a44;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
}

.app { min-height: 100vh; display: flex; flex-direction: column; }

.nav-bar {
  background: var(--bg-nav);
  border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 100;
}

.nav-inner {
  max-width: 1200px; margin: 0 auto;
  display: flex; align-items: center;
  padding: 0 24px; height: 64px;
}

.nav-logo {
  display: flex; align-items: center; gap: 8px;
  text-decoration: none; font-size: 20px; font-weight: 700;
  color: var(--text); margin-right: 40px;
}

.logo-icon { font-size: 24px; }

.nav-links { display: flex; gap: 4px; flex: 1; }

.nav-link {
  text-decoration: none; color: var(--text-secondary);
  padding: 8px 16px; border-radius: 8px;
  font-size: 14px; transition: all 0.2s;
}

.nav-link:hover { color: var(--text); background: rgba(255,255,255,0.05); }
.nav-link.router-link-active { color: var(--primary); background: rgba(79,70,229,0.1); }

.nav-user { display: flex; align-items: center; gap: 12px; }

.user-name { font-size: 14px; color: var(--text-secondary); }

.btn-login, .btn-logout {
  padding: 6px 16px; border-radius: 8px; font-size: 14px;
  text-decoration: none; cursor: pointer; transition: all 0.2s;
}

.btn-login {
  background: var(--primary); color: white; border: none;
}
.btn-login:hover { background: var(--primary-dark); }

.btn-logout {
  background: transparent; color: var(--text-secondary);
  border: 1px solid var(--border);
}
.btn-logout:hover { color: var(--danger); border-color: var(--danger); }

.main-content { flex: 1; max-width: 1200px; margin: 0 auto; padding: 32px 24px; width: 100%; }

.footer {
  background: var(--bg-nav); border-top: 1px solid var(--border);
  padding: 24px; text-align: center;
}

.footer-inner { max-width: 1200px; margin: 0 auto; }
.footer p { color: var(--text-secondary); font-size: 14px; }
.footer-sub { font-size: 12px; margin-top: 4px; opacity: 0.7; }

/* 通用组件样式 */
.page-title { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
.page-desc { color: var(--text-secondary); margin-bottom: 32px; }

.card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 12px; padding: 24px;
}

.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px; border-radius: 8px; font-size: 14px;
  font-weight: 500; cursor: pointer; border: none;
  transition: all 0.2s;
}

.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-dark); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary {
  background: transparent; color: var(--text-secondary);
  border: 1px solid var(--border);
}
.btn-secondary:hover { color: var(--text); border-color: var(--text-secondary); }

.btn-danger { background: var(--danger); color: white; }
.btn-danger:hover { opacity: 0.9; }

.input {
  width: 100%; padding: 10px 14px; border-radius: 8px;
  background: var(--bg); border: 1px solid var(--border);
  color: var(--text); font-size: 14px; outline: none;
  transition: border-color 0.2s;
}
.input:focus { border-color: var(--primary); }

select.input { cursor: pointer; }

.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 14px; color: var(--text-secondary); margin-bottom: 6px; }

.tag {
  display: inline-block; padding: 2px 10px; border-radius: 4px;
  font-size: 12px; background: rgba(79,70,229,0.15); color: #818cf8;
}

.loading {
  text-align: center; padding: 60px 20px; color: var(--text-secondary);
}

.empty-state {
  text-align: center; padding: 60px 20px; color: var(--text-secondary);
}
.empty-state .icon { font-size: 48px; margin-bottom: 16px; }
</style>