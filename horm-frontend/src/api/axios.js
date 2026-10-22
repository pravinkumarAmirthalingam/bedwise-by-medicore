import axios from 'axios'

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/',
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
