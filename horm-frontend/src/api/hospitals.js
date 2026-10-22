import api from './axios'

export const getHospitals = ()              => api.get('/api/hospitals').then(r => r.data)
export const getHospitalById = (id)         => api.get(`/api/hospitals/${id}`).then(r => r.data)
export const getHospitalOccupancy = (id)    => api.get(`/api/hospitals/${id}/occupancy`).then(r => r.data)
export const createHospital = (data)        => api.post('/api/hospitals', data).then(r => r.data)
export const updateHospital = (id, data)    => api.put(`/api/hospitals/${id}`, data).then(r => r.data)
export const deleteHospital = (id)          => api.delete(`/api/hospitals/${id}`).then(r => r.data)
