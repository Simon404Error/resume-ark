import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../utils/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref<any>(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const userName = computed(() => user.value?.name || '')
  const userEmail = computed(() => user.value?.email || '')

  async function login(email: string, password: string) {
    const res = await authApi.login({ email, password })
    token.value = res.data.token
    user.value = res.data.user
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
  }

  async function register(email: string, password: string, name: string) {
    const res = await authApi.register({ email, password, name })
    token.value = res.data.token
    user.value = res.data.user
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, isLoggedIn, userName, userEmail, login, register, logout }
})