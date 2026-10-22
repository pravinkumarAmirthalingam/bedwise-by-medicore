import axios from 'axios'

export const axiosInstance = axios.create({
  baseURL: '/',            // Vite dev proxy handles /api → localhost:8080
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

export function setAuthHeader(username, password) {
  const token = btoa(`${username}:${password}`)
  axiosInstance.defaults.headers.common['Authorization'] = `Basic ${token}`
}

export function clearAuthHeader() {
  delete axiosInstance.defaults.headers.common['Authorization']
}

export default axiosInstance
