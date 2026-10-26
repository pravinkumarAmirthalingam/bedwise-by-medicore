import { createContext, useContext, useState, useCallback } from 'react'
import { axiosInstance, setAuthHeader, clearAuthHeader } from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Restore session from sessionStorage (not localStorage — avoids persistence risk)
    try {
      const stored = sessionStorage.getItem('horm_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (username, password) => {
    // Set header and make a test call to verify credentials
    setAuthHeader(username, password)
    try {
      // /api/beds is accessible to both SUPER_ADMIN and HOSPITAL_ADMIN
      // Fetch it to verify the credentials & detect role from 403 pattern
      await axiosInstance.get('/api/beds')
      const userData = { username, password, role: deriveRole(username) }
      setUser(userData)
      sessionStorage.setItem('horm_user', JSON.stringify(userData))
      return { ok: true }
    } catch (err) {
      // If /api/beds is 403, try /api/hospitals (SUPER_ADMIN only)
      if (err.response?.status === 403) {
        try {
          await axiosInstance.get('/api/hospitals')
          const userData = { username, password, role: 'SUPER_ADMIN' }
          setUser(userData)
          sessionStorage.setItem('horm_user', JSON.stringify(userData))
          return { ok: true }
        } catch {
          // fall through
        }
      }
      clearAuthHeader()
      const message =
        err.response?.status === 401
          ? 'Invalid username or password.'
          : err.response?.status === 403
          ? 'Access denied for this role.'
          : 'Cannot reach server. Is the backend running?'
      return { ok: false, message }
    }
  }, [])

  const logout = useCallback(() => {
    clearAuthHeader()
    setUser(null)
    sessionStorage.removeItem('horm_user')
  }, [])

  // Re-apply stored credentials on context mount
  if (user?.username && user?.password) {
    setAuthHeader(user.username, user.password)
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isHospitalAdmin = user?.role === 'HOSPITAL_ADMIN'

  return (
    <AuthContext.Provider value={{ user, login, logout, isSuperAdmin, isHospitalAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

// Derive role from the seeded usernames; real apps would get this from a /me endpoint
function deriveRole(username) {
  if (username === 'superadmin') return 'SUPER_ADMIN'
  if (username === 'hospitaladmin') return 'HOSPITAL_ADMIN'
  return 'PUBLIC_USER'
}
