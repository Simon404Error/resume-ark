<template>
  <div class="login-page">
    <div class="login-card card">
      <h2>{{ isRegister ? '注册账号' : '登录' }}</h2>
      <p class="form-desc">
        {{ isRegister ? '创建账号开始使用简历方舟' : '登录后即可管理简历和使用智能填写' }}
      </p>

      <form @submit.prevent="handleSubmit">
        <div v-if="isRegister" class="form-group">
          <label class="form-label">姓名</label>
          <input v-model="form.name" class="input" placeholder="请输入姓名" required />
        </div>
        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input v-model="form.email" type="email" class="input" placeholder="请输入邮箱" required />
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input v-model="form.password" type="password" class="input" placeholder="请输入密码" required minlength="6" />
        </div>
        <div v-if="error" class="error-msg">{{ error }}</div>
        <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
          {{ loading ? '处理中...' : (isRegister ? '注册' : '登录') }}
        </button>
      </form>

      <div class="switch-mode">
        <span v-if="isRegister">已有账号？</span>
        <span v-else>没有账号？</span>
        <button class="link-btn" @click="isRegister = !isRegister">
          {{ isRegister ? '去登录' : '去注册' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const isRegister = ref(false)
const loading = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  email: '',
  password: ''
})

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    if (isRegister.value) {
      await userStore.register(form.email, form.password, form.name)
    } else {
      await userStore.login(form.email, form.password)
    }
    router.push('/')
  } catch (err: any) {
    error.value = err.response?.data?.error || '操作失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex; justify-content: center; padding: 60px 20px;
}

.login-card {
  width: 100%; max-width: 420px; padding: 40px;
}

.login-card h2 { font-size: 24px; margin-bottom: 4px; }

.form-desc { color: var(--text-secondary); font-size: 14px; margin-bottom: 24px; }

.btn-full { width: 100%; justify-content: center; }

.error-msg {
  background: rgba(239,68,68,0.1); color: var(--danger);
  padding: 8px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 16px;
}

.switch-mode { margin-top: 20px; text-align: center; font-size: 14px; color: var(--text-secondary); }

.link-btn {
  background: none; border: none; color: var(--primary); cursor: pointer;
  font-size: 14px; text-decoration: underline;
}
</style>