import axios from 'axios'

const API_BASE = '/api' // Always use proxy

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

// FTP接続API
export const ftpApi = {
  getAll: () => api.get('/ftp'),
  get: (id: number) => api.get(`/ftp/${id}`),
  create: (data: any) => api.post('/ftp', data),
  update: (id: number, data: any) => api.put(`/ftp/${id}`, data),
  delete: (id: number) => api.delete(`/ftp/${id}`),
  test: (id: number) => api.post(`/ftp/${id}/test`),
  listFiles: (id: number, directory?: string) => 
    api.get(`/ftp/${id}/list`, { params: { directory } })
}

// スケジュールAPI
export const scheduleApi = {
  getAll: () => api.get('/schedules'),
  get: (id: number) => api.get(`/schedules/${id}`),
  create: (data: any) => api.post('/schedules', data),
  update: (id: number, data: any) => api.put(`/schedules/${id}`, data),
  delete: (id: number) => api.delete(`/schedules/${id}`),
  trigger: (id: number) => api.post(`/schedules/${id}/trigger`),
  getActive: () => api.get('/schedules/status/active')
}

// アップロードAPI
export const uploadApi = {
  uploadCsv: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/uploads/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  uploadMultipleCsv: (files: File[]) => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    return api.post('/uploads/csv/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  getHistory: (limit = 100, offset = 0, status?: string) => 
    api.get('/uploads/history', { params: { limit, offset, status } }),
  getStatistics: () => api.get('/uploads/statistics'),
  getFiles: () => api.get('/uploads/files'),
  deleteFile: (filename: string) => api.delete(`/uploads/files/${filename}`),
  getQueue: (scheduleId?: number, status?: string) => 
    api.get('/uploads/queue', { params: { schedule_id: scheduleId, status } }),
  clearQueue: (scheduleId: number) => api.delete(`/uploads/queue/${scheduleId}`)
}

export default api