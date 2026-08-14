import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 请求拦截器：自动附加 token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：处理 token 过期
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// --- API 方法 ---

// 认证
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: { name?: string; phone?: string }) =>
    api.put('/auth/profile', data)
}

// 简历
export const resumeApi = {
  upload: (formData: FormData) =>
    api.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  list: () => api.get('/resume/list'),
  detail: (id: string) => api.get(`/resume/${id}`),
  delete: (id: string) => api.delete(`/resume/${id}`),
  optimize: (data: { resumeId: string; companyName: string; positionName: string }) =>
    api.post('/resume/optimize', data)
}

// 校招
export const campusApi = {
  getJobs: (params: {
    page?: number; pageSize?: number; keyword?: string;
    jobType?: string; location?: string; company?: string
  }) => api.get('/campus/jobs', { params }),
  getFilters: () => api.get('/campus/filters'),
  getJobDetail: (id: string) => api.get(`/campus/jobs/${id}`),
  getApplications: () => api.get('/campus/applications'),
  addApplication: (data: { company: string; position: string; applyUrl?: string; jobId?: string }) =>
    api.post('/campus/applications', data),
  updateApplication: (id: string, data: { status: string; notes?: string }) =>
    api.put(`/campus/applications/${id}`, data),
  deleteApplication: (id: string) => api.delete(`/campus/applications/${id}`)
}

// 自动填写
export const autofillApi = {
  fillForm: (data: { resumeId?: string; formFields: any[]; pageUrl?: string }) =>
    api.post('/autofill/fill', data),
  analyzeForm: (data: { pageHtml: string; pageUrl: string }) =>
    api.post('/autofill/analyze-form', data),
  saveMemory: (data: { fieldKey: string; fieldValue: string }) =>
    api.post('/autofill/save-memory', data),
  getMemories: () => api.get('/autofill/memories')
}