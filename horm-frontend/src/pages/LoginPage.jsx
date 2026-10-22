import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Activity, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username.trim() || !password) return
    setError('')
    setLoading(true)
    const result = await login(username.trim(), password)
    setLoading(false)
    if (result.ok) {
      navigate('/dashboard', { replace: true })
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-mark">
            <Activity size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              HORM
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>
              Hospital Resource System
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Clinical Sign In
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Enter your credentials to access the dashboard
          </div>
        </div>

        {error && (
          <div className="error-banner" style={{ marginBottom: 'var(--space-4)' }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} id="login-form" noValidate>
          <div className="input-group">
            <label className="input-label" htmlFor="login-username">Username</label>
            <div className="search-wrapper">
              <User size={14} className="search-icon" />
              <input
                id="login-username"
                className="input input-search"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="login-password">Password</label>
            <div className="search-wrapper">
              <Lock size={14} className="search-icon" />
              <input
                id="login-password"
                className="input input-search"
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ paddingRight: 36 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
                  display: 'flex', alignItems: 'center',
                }}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            className="btn btn-primary btn-full btn-lg"
            type="submit"
            disabled={loading || !username.trim() || !password}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Authenticating…
              </>
            ) : (
              'Sign In to HORM'
            )}
          </button>
        </form>

        <div className="login-hint">
          <strong>Seeded credentials:</strong><br />
          superadmin / superAdmin@123 (Super Admin)<br />
          hospitaladmin / hospitalAdmin@123 (Hospital Admin)
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-4)', fontSize: '0.7rem', color: 'var(--text-faint)', textAlign: 'center' }}>
        Secured by Spring Security · HTTP Basic · HORM v1.0
      </div>
    </div>
  )
}
