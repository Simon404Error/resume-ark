<template>
  <div class="resume-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">简历管理</h1>
        <p class="page-desc">上传和管理你的简历，AI 自动解析并提取信息</p>
      </div>
      <button v-if="userStore.isLoggedIn" class="btn btn-primary" @click="showUploader = true">
        + 上传简历
      </button>
      <router-link v-else to="/login" class="btn btn-primary">登录后上传</router-link>
    </div>

    <!-- Upload Form -->
    <div v-if="showUploader" class="upload-section card">
      <h3>上传简历</h3>
      <p class="upload-desc">支持 PDF、Word、TXT 格式，文件大小不超过 10MB</p>
      <div
        class="drop-zone"
        @dragover.prevent
        @drop.prevent="handleDrop"
        @click="triggerUpload"
      >
        <div v-if="!uploading" class="drop-content">
          <div class="upload-icon">📄</div>
          <p>拖拽文件到此处，或点击选择文件</p>
        </div>
        <div v-else class="upload-progress">
          <div class="spinner"></div>
          <p>正在上传并解析...</p>
        </div>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        style="display:none"
        @change="handleFileSelect"
      />
      <div v-if="uploadResult" class="upload-result">
        <p v-if="uploadResult.parsed">✅ AI 解析成功！已提取简历中的关键信息。</p>
        <p v-else>⚠️ 文件已上传，但 AI 解析暂未完成（仅支持 TXT 格式的完整解析）</p>
      </div>
      <button v-if="showUploader" class="btn btn-secondary" @click="showUploader = false" style="margin-top:12px">取消</button>
    </div>

    <!-- Resume List -->
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="resumes.length === 0" class="empty-state">
      <div class="icon">📄</div>
      <p>还没有上传简历</p>
      <button v-if="userStore.isLoggedIn" class="btn btn-primary" @click="showUploader = true">上传第一份简历</button>
    </div>
    <div v-else class="resume-list">
      <div v-for="resume in resumes" :key="resume.id" class="resume-card card">
        <div class="resume-info">
          <h3>{{ resume.name }}</h3>
          <div class="resume-meta">
            <span>版本 {{ resume.version }}</span>
            <span>{{ resume.file_type }}</span>
            <span v-if="resume.is_parsed" class="tag">已解析</span>
            <span v-else class="tag" style="background:rgba(245,158,11,0.15);color:#f59e0b;">未解析</span>
          </div>
          <p class="resume-date">上传于 {{ resume.created_at }}</p>
        </div>
        <div class="resume-actions">
          <button class="btn btn-secondary btn-sm" @click="viewDetail(resume.id)">查看</button>
          <button class="btn btn-danger btn-sm" @click="deleteResume(resume.id)">删除</button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="detail" class="modal-overlay" @click="detail = null">
      <div class="modal card" @click.stop>
        <button class="modal-close" @click="detail = null">✕</button>
        <h2>{{ detail.name }}</h2>
        <div class="parsed-data" v-if="detail.parsedData">
          <div class="data-section">
            <h4>基本信息</h4>
            <p>姓名：{{ detail.parsedData.name || '—' }}</p>
            <p>电话：{{ detail.parsedData.phone || '—' }}</p>
            <p>邮箱：{{ detail.parsedData.email || '—' }}</p>
          </div>
          <div class="data-section" v-if="detail.parsedData.education?.length">
            <h4>教育经历</h4>
            <div v-for="(edu, i) in detail.parsedData.education" :key="i" class="data-item">
              <p>{{ edu.school }} · {{ edu.major }} · {{ edu.degree }}</p>
              <p class="data-date">{{ edu.startDate }} ~ {{ edu.endDate }}</p>
            </div>
          </div>
          <div class="data-section" v-if="detail.parsedData.workExperience?.length">
            <h4>工作经历</h4>
            <div v-for="(exp, i) in detail.parsedData.workExperience" :key="i" class="data-item">
              <p>{{ exp.company }} · {{ exp.position }}</p>
              <p class="data-date">{{ exp.startDate }} ~ {{ exp.endDate }}</p>
            </div>
          </div>
          <div class="data-section" v-if="detail.parsedData.skills?.length">
            <h4>技能</h4>
            <span class="tag" v-for="s in detail.parsedData.skills" :key="s">{{ s }}</span>
          </div>
        </div>
        <div v-else class="no-data">
          <p>暂无解析数据。上传 TXT 格式简历可获得完整的 AI 解析。</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="detail = null">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { resumeApi } from '../utils/api'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const fileInput = ref<HTMLInputElement | null>(null)

const loading = ref(false)
const resumes = ref<any[]>([])
const showUploader = ref(false)
const uploading = ref(false)
const uploadResult = ref<any>(null)
const detail = ref<any>(null)

async function fetchResumes() {
  if (!userStore.isLoggedIn) return
  loading.value = true
  try {
    const res = await resumeApi.list()
    resumes.value = res.data.resumes
  } catch { /* ignore */ }
  finally { loading.value = false }
}

function triggerUpload() { fileInput.value?.click() }

async function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files?.length) await uploadFile(target.files[0])
}

async function handleDrop(e: DragEvent) {
  if (e.dataTransfer?.files.length) await uploadFile(e.dataTransfer.files[0])
}

async function uploadFile(file: File) {
  uploading.value = true
  uploadResult.value = null
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await resumeApi.upload(formData)
    uploadResult.value = res.data
    await fetchResumes()
  } catch (err: any) {
    alert(err.response?.data?.error || '上传失败')
  } finally {
    uploading.value = false
  }
}

async function viewDetail(id: string) {
  try {
    const res = await resumeApi.detail(id)
    detail.value = res.data.resume
  } catch { alert('获取详情失败') }
}

async function deleteResume(id: string) {
  if (!confirm('确定删除该简历吗？')) return
  try {
    await resumeApi.delete(id)
    await fetchResumes()
  } catch { alert('删除失败') }
}

onMounted(fetchResumes)
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.upload-section { margin-bottom: 24px; }
.upload-desc { color: var(--text-secondary); font-size: 14px; margin-bottom: 16px; }
.drop-zone {
  border: 2px dashed var(--border); border-radius: 12px; padding: 40px;
  text-align: center; cursor: pointer; transition: all 0.2s;
}
.drop-zone:hover { border-color: var(--primary); background: rgba(79,70,229,0.05); }
.drop-content { color: var(--text-secondary); }
.upload-icon { font-size: 48px; margin-bottom: 12px; }
.upload-progress { color: var(--text-secondary); }
.spinner {
  width: 32px; height: 32px; border: 3px solid var(--border);
  border-top-color: var(--primary); border-radius: 50%;
  animation: spin 0.8s linear infinite; margin: 0 auto 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.upload-result { margin-top: 12px; font-size: 14px; }

.resume-list { display: grid; gap: 12px; }
.resume-card { display: flex; justify-content: space-between; align-items: center; }
.resume-info h3 { font-size: 16px; margin-bottom: 4px; }
.resume-meta { display: flex; gap: 8px; font-size: 12px; color: var(--text-secondary); align-items: center; }
.resume-date { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.resume-actions { display: flex; gap: 8px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal { max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative; }
.modal-close { position: absolute; top: 16px; right: 16px; background: none; border: none; color: var(--text-secondary); font-size: 20px; cursor: pointer; }
.modal h2 { margin-bottom: 16px; padding-right: 32px; }
.data-section { margin-bottom: 16px; }
.data-section h4 { font-size: 14px; color: var(--primary); margin-bottom: 8px; }
.data-section p { font-size: 14px; margin-bottom: 2px; }
.data-item { margin-bottom: 8px; }
.data-date { font-size: 12px; color: var(--text-secondary); }
.no-data { padding: 20px; text-align: center; color: var(--text-secondary); }
.modal-actions { margin-top: 16px; display: flex; gap: 8px; }
</style>