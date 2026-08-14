<template>
  <div class="campus-page">
    <h1 class="page-title">校招汇总表</h1>
    <p class="page-desc">汇总各大公司校园招聘、实习、内推信息，实时更新</p>

    <!-- Filter Bar -->
    <div class="filter-bar card">
      <div class="filter-row">
        <div class="filter-group">
          <input
            v-model="filters.keyword"
            class="input"
            placeholder="搜索公司/岗位/关键词..."
            @input="onSearch"
          />
        </div>
        <div class="filter-group">
          <select v-model="filters.jobType" class="input" @change="fetchJobs">
            <option value="">全部类型</option>
            <option v-for="t in filterOptions.jobTypes" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div class="filter-group">
          <select v-model="filters.company" class="input" @change="fetchJobs">
            <option value="">全部公司</option>
            <option v-for="c in filterOptions.companies" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="filter-group">
          <select v-model="filters.location" class="input" @change="fetchJobs">
            <option value="">全部地点</option>
            <option v-for="l in filterOptions.locations" :key="l" :value="l">{{ l }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-bar">
      <span>共 <strong>{{ pagination.total }}</strong> 个岗位</span>
      <span class="tag" v-for="tag in filterOptions.tags.slice(0, 8)" :key="tag">{{ tag }}</span>
    </div>

    <!-- Job List -->
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="jobs.length === 0" class="empty-state">
      <div class="icon">🔍</div>
      <p>暂无匹配的岗位信息</p>
    </div>
    <div v-else class="job-list">
      <div v-for="job in jobs" :key="job.id" class="job-card card" @click="showDetail(job)">
        <div class="job-header">
          <h3 class="job-company">{{ job.company }}</h3>
          <span class="job-type tag">{{ job.job_type }}</span>
        </div>
        <h4 class="job-title">{{ job.title }}</h4>
        <div class="job-meta">
          <span v-if="job.location" class="meta-item">📍 {{ job.location }}</span>
          <span v-if="job.salary" class="meta-item">💰 {{ job.salary }}</span>
          <span v-if="job.deadline" class="meta-item">⏰ {{ job.deadline }}</span>
        </div>
        <div class="job-tags" v-if="job.tags">
          <span class="tag" v-for="tag in (job.tags || '').split(',').filter(Boolean)" :key="tag">{{ tag.trim() }}</span>
        </div>
        <div class="job-footer">
          <span class="source" v-if="job.source">来源: {{ job.source }}</span>
          <div class="job-actions">
            <a :href="job.apply_url" target="_blank" class="btn btn-primary btn-sm" @click.stop>立即申请</a>
            <button v-if="userStore.isLoggedIn" class="btn btn-secondary btn-sm" @click.stop="trackApplication(job)">记录投递</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="pagination.totalPages > 1">
      <button
        class="btn btn-secondary btn-sm"
        :disabled="pagination.page <= 1"
        @click="goPage(pagination.page - 1)"
      >上一页</button>
      <span class="page-info">第 {{ pagination.page }} / {{ pagination.totalPages }} 页</span>
      <button
        class="btn btn-secondary btn-sm"
        :disabled="pagination.page >= pagination.totalPages"
        @click="goPage(pagination.page + 1)"
      >下一页</button>
    </div>

    <!-- Detail Modal -->
    <div v-if="selectedJob" class="modal-overlay" @click="selectedJob = null">
      <div class="modal card" @click.stop>
        <button class="modal-close" @click="selectedJob = null">✕</button>
        <h2>{{ selectedJob.company }} - {{ selectedJob.title }}</h2>
        <div class="modal-meta">
          <p v-if="selectedJob.location"><strong>工作地点：</strong>{{ selectedJob.location }}</p>
          <p v-if="selectedJob.salary"><strong>薪资：</strong>{{ selectedJob.salary }}</p>
          <p v-if="selectedJob.deadline"><strong>截止日期：</strong>{{ selectedJob.deadline }}</p>
          <p v-if="selectedJob.job_type"><strong>类型：</strong>{{ selectedJob.job_type }}</p>
        </div>
        <p v-if="selectedJob.description" class="modal-desc">{{ selectedJob.description }}</p>
        <div class="modal-actions">
          <a :href="selectedJob.apply_url" target="_blank" class="btn btn-primary">立即申请</a>
          <button v-if="userStore.isLoggedIn" class="btn btn-secondary" @click="trackApplication(selectedJob)">记录投递</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { campusApi } from '../utils/api'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

interface Job {
  id: string; company: string; title: string; location: string;
  salary: string; deadline: string; job_type: string; description: string;
  apply_url: string; source: string; tags: string; is_active: number;
}

interface Pagination { page: number; pageSize: number; total: number; totalPages: number }

const loading = ref(false)
const jobs = ref<Job[]>([])
const selectedJob = ref<Job | null>(null)
const pagination = ref<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
const filterOptions = reactive({ companies: [] as string[], locations: [] as string[], jobTypes: [] as string[], tags: [] as string[] })

const filters = reactive({
  keyword: '', jobType: '', company: '', location: ''
})

let searchTimer: ReturnType<typeof setTimeout> | null = null

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { pagination.value.page = 1; fetchJobs() }, 300)
}

async function fetchJobs() {
  loading.value = true
  try {
    const res = await campusApi.getJobs({ ...filters, page: pagination.value.page, pageSize: pagination.value.pageSize })
    jobs.value = res.data.jobs
    pagination.value = res.data.pagination
  } catch { /* ignore */ }
  finally { loading.value = false }
}

async function fetchFilters() {
  try {
    const res = await campusApi.getFilters()
    Object.assign(filterOptions, res.data)
  } catch { /* ignore */ }
}

function goPage(page: number) {
  pagination.value.page = page
  fetchJobs()
}

function showDetail(job: Job) { selectedJob.value = job }

async function trackApplication(job: Job) {
  try {
    await campusApi.addApplication({
      company: job.company,
      position: job.title,
      applyUrl: job.apply_url,
      jobId: job.id
    })
    alert('已记录到投递管理！')
  } catch { alert('记录失败，请重试') }
}

onMounted(() => { fetchFilters(); fetchJobs() })
</script>

<style scoped>
.filter-bar { margin-bottom: 20px; padding: 16px 20px; }
.filter-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.filter-group { flex: 1; min-width: 180px; }
.stats-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; font-size: 14px; color: var(--text-secondary); }
.job-list { display: grid; gap: 16px; margin-bottom: 24px; }
.job-card { cursor: pointer; transition: border-color 0.2s; }
.job-card:hover { border-color: var(--primary); }
.job-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.job-company { font-size: 18px; font-weight: 600; }
.job-title { font-size: 15px; color: var(--text-secondary); margin-bottom: 8px; }
.job-meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
.job-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 12px; }
.job-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid var(--border); }
.source { font-size: 12px; color: var(--text-secondary); }
.job-actions { display: flex; gap: 8px; }
.btn-sm { padding: 6px 14px; font-size: 12px; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 16px; padding: 20px 0; }
.page-info { font-size: 14px; color: var(--text-secondary); }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 200;
}
.modal { max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative; }
.modal-close {
  position: absolute; top: 16px; right: 16px;
  background: none; border: none; color: var(--text-secondary);
  font-size: 20px; cursor: pointer;
}
.modal h2 { margin-bottom: 16px; padding-right: 32px; }
.modal-meta { margin-bottom: 16px; }
.modal-meta p { font-size: 14px; margin-bottom: 4px; }
.modal-desc { font-size: 14px; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.7; }
.modal-actions { display: flex; gap: 8px; }
</style>