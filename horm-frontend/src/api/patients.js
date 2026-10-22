import api from './axios'

export const getPatients = ()                => api.get('/api/patient').then(r => r.data)
export const createPatient = (data)          => api.post('/api/patient', data).then(r => r.data)
export const updatePatient = (id, data)      => api.put(`/api/patient/${id}`, data).then(r => r.data)
export const deletePatient = (id)            => api.delete(`/api/patient/${id}`).then(r => r.data)
