import api from './axios'

export const getBeds = ()                    => api.get('/api/beds').then(r => r.data)
export const getBedById = (id)               => api.get(`/api/beds/${id}`).then(r => r.data)
export const getAvailableBeds = (type)       => api.get('/api/beds/available', { params: type ? { type } : {} }).then(r => r.data)
export const createBed = (data)              => api.post('/api/beds', data).then(r => r.data)
export const deleteBed = (id)                => api.delete(`/api/beds/${id}`).then(r => r.data)
