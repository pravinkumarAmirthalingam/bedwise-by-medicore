import api from './axios'

export const getAdmissions = ()              => api.get('/api/admissions').then(r => r.data)
export const getAdmissionById = (id)         => api.get(`/api/admissions/${id}`).then(r => r.data)
export const createAdmission = (patientId, bedId) =>
  api.post('/api/admissions', { patientId, bedId }).then(r => r.data)
export const dischargeAdmission = (id)       => api.patch(`/api/admissions/${id}/discharge`).then(r => r.data)
