<template>
  <div class="applications-page">
    <h1 class="page-title">投递记录</h1>
    <p class="page-desc">跟踪你的每一份投递，从投递到 Offer 全程管理</p>

    <div v-if="!userStore.isLoggedIn" class="empty-state">
      <div class="icon">🔒</div>
      <p>请先登录以管理投递记录</p>
      <router-link to="/login" class="btn btn-primary">去登录</router-link>
    </div>

    <template v-else>
      <!-- Status Summary -->
      <div class="summary-bar">
        <div class="summary-item">
          <span class="summary-num">{{ stats.total }}</span>
          <span class="summary-label">总计</span>
        </div>
        <div class="summary-item">
          <span class="summary-num" style="color:var(--primary)">{{ stats.submitted }}</span>
          <span class="summary-label">已投递</span>
        </div>
        <div class="summary-item">
          <span class="summary-num" style="color:var(--warning)">{{ stats.screening }}</span>
          <span class="summary-label">筛选中</span>
        </div>
        <div class="summary-item">
          <span class="summary-num" style="color:var(--success)">{{ stats.interview }}</span>
          <span class="summary-label">面试中</span>
        </div>
        <div class="summary-item">
          <span class="summary-num" style="color:#818cf8">{{ stats.offer }}</span>
          <span class="summary-label">已拿 Offer</span>
        </div>
      </div>

      <!-- Application List -->
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="applications.length === 0" class="empty-state">
        <div class="icon">📋</div>
        <p>还没有投递记录</p>
        <router-link to="/campus" class="btn btn-primary">去看看校招信息</router-link>
      </div>
      <div v-else class="app-list">
        <div v-for="app in applications" :key="app.id" class="app-card card">
          <div class="app-header">
            <h3>{{ app.company }}</h3>
            <span :class="['status-badge', statusClass(app.status)]">{{ app.status }}</span>
          </div>
          <p class="app-position">{{ app.position }}</p>
          <div class="app-meta">
            <span>投递时间：{{ app.applied_at }}</span>
            <a v-if="app.apply_url" :href="app.apply_url" target="_blank" class="link">查看链接</a>
          </div>
          <p v-if="app.notes" class="app-notes">{{ app.notes }}</p>
          <div class="app-actions">
            <button class="btn btn-secondary btn-sm" @click="editApp(app)">更新状态</button>
            <button class="btn btn-danger btn-sm" @click="deleteApp(app.id)">删除</button>
          </div>
        </div>
      </div>

      <!-- Edit Modal -->
      <div v-if="editingApp" class="modal-overlay" @click="editingApp = null">
        <div class="modal card" @click.stop>
          <button class="modal-close" @click="editingApp = null">✕</button>
          <h3>更新投递状态</h3>
          <p class="app-info">{{ editingApp.company }} - {{ editingApp.position }}</p>
          <div class="form-group">
            <label class="form-label">状态</label>
            <select v-model="editForm.status" class="input">
              <option value="已投递">已投递</option>
              <option value="筛选中">筛选中</option>
              <option value="笔试">笔试</option>
              <option value="面试">面试中</option>
              <option value="Offer">已拿 Offer</option>
              <option value="被拒">被拒</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea v-model="editForm.notes" class="input" rows="3" placeholder="添加备注..."></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn btn-primary" @click="saveEdit">保存</button>
            <button class="btn btn-secondary" @click="editingApp = null">取消</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { campusApi } from '../utils/api'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const loading = ref(false)
const applications = ref<any[]>([])
const editingApp = ref<any>(null)
const editForm = ref({ status: '已投递', notes: '' })

const stats = computed(() => {
  const all = applications.value
  return {
    total: all.length,
    submitted: all.filter(a => a.status === '已投递').length,
    screening: all.filter(a => a.status === '筛选中' || a.status === '笔试').length,
    interview: all.filter(a => a.status === '面试').length,
    offer: all.filter(a => a.status === 'Offer').length
  }
})

function statusClass(s: string) {
  const map: Record<string, string> = {
    '已投递': 'status-submitted',
    '筛选中': 'status-screening',
    '笔试': 'status-screening',
    '面试': 'status-interview',
    '面试中': 'status-interview',
    'Offer': 'status-offer',
    '被拒': 'status-rejected'
  }
  return map[s] || ''
}

async function fetchApplications() {
  if (!userStore.isLoggedIn) return
  loading.value = true
  try {
    const res = await campusApi.getApplications()
    applications.value = res.data.applications || []
  } catch { /* ignore */ }
  finally { loading.value = false }
}

function editApp(app: any) {
  editingApp.value = app
  editForm.value = { status: app.status || '已投递', notes: app.notes || '' }
}

async function saveEdit() {
  if (!editingApp.value) return
  try {
    await campusApi.updateApplication(editingApp.value.id, editForm.value)
    editingApp.value = null
    await fetchApplications()
  } catch { alert('更新失败') }
}

async function deleteApp(id: string) {
  if (!confirm('确定删除这条记录吗？')) return
  try {
    await campusApi.deleteApplication(id)
    await fetchApplications()
  } catch { alert('删除失败') }
}

onMounted(fetchApplications)
</script>

<style scoped>
.summary-bar {
  display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;
}
.summary-item {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 12px; padding: 16px 24px; text-align: center; flex: 1; min-width: 100px;
}
.summary-num { display: block; font-size: 28px; font-weight: 700; }
.summary-label { font-size: 13px; color: var(--text-secondary); }

.app-list { display: grid; gap: 12px; }
.app-card { }
.app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.app-header h3 { font-size: 18px; }
.status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.status-submitted { background: rgba(79,70,229,0.15); color: #818cf8; }
.status-screening { background: rgba(245,158,11,0.15); color: #f59e0b; }
.status-interview { background: rgba(34,197,94,0.15); color: #22c55e; }
.status-offer { background: rgba(34,197,94,0.15); color: #22c55e; }
.status-rejected { background: rgba(239,68,68,0.15); color: #ef4444; }

.app-position { font-size: 15px; color: var(--text-secondary); margin-bottom: 8px; }
.app-meta { display: flex; gap: 16px; font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }
.link { color: var(--primary); text-decoration: none; }
.app-notes { font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
.app-actions { display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal { max-width: 480px; width: 90%; position: relative; }
.modal-close { position: absolute; top: 16px; right: 16px; background: none; border: none; color: var(--text-secondary); font-size: 20px; cursor: pointer; }
.app-info { font-size: 14px; color: var(--text-secondary); margin-bottom: 20px; }
textarea.input { resize: vertical; min-height: 80px; }
.modal-actions { display: flex; gap: 8px; margin-top: 8px; }
</style>