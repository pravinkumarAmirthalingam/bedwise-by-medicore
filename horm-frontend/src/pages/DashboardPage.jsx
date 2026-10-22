import { useEffect, useState } from 'react'
import { getBeds } from '../api/beds'
import { getAdmissions } from '../api/admissions'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  BedDouble, CheckCircle2, XCircle, Users, AlertTriangle,
  TrendingUp, ChevronRight, X, UserPlus, FileText, ArrowLeftRight,
  Building2, Shield, Globe, ChevronDown
} from 'lucide-react'
import NewAdmissionModal from '../components/NewAdmissionModal'
import StatusBadge from '../components/StatusBadge'

function useBeds() {
  const [beds, setBeds] = useState([])
  const [admissions, setAdmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    try {
      const [b, a] = await Promise.all([getBeds(), getAdmissions()])
      setBeds(b)
      setAdmissions(a)
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  return { beds, admissions, loading, error, reload: load }
}

export default function DashboardPage() {
  const { user, isSuperAdmin, isHospitalAdmin } = useAuth()
  const navigate = useNavigate()
  const { beds, admissions, loading, error, reload } = useBeds()
  const [showAlert, setShowAlert] = useState(true)
  const [showAdmitModal, setShowAdmitModal] = useState(false)
  const [activeRoleTab, setActiveRoleTab] = useState(
    isSuperAdmin ? 'super' : isHospitalAdmin ? 'hospital' : 'public'
  )

  // Derived statistics from real data
  const total       = beds.length
  const occupied    = beds.filter(b => b.status?.toUpperCase() === 'OCCUPIED').length
  const available   = beds.filter(b => b.status?.toUpperCase() === 'AVAILABLE').length
  const reserved    = beds.filter(b => b.status?.toUpperCase() === 'RESERVED').length
  const maintenance = beds.filter(b =>
    ['MAINTENANCE', 'SANITIZING'].includes(b.status?.toUpperCase())).length
  const offline     = reserved + maintenance

  const occupancyPct = total > 0 ? ((occupied / total) * 100).toFixed(1) : 0
  const availablePct = total > 0 ? ((available / total) * 100).toFixed(1) : 0
  const reservedPct  = total > 0 ? ((reserved / total) * 100).toFixed(1) : 0
  const maintPct     = total > 0 ? ((maintenance / total) * 100).toFixed(1) : 0

  // Group by bed type for ward breakdown
  const byType = beds.reduce((acc, b) => {
    const type = b.type || 'General'
    if (!acc[type]) acc[type] = { total: 0, occupied: 0 }
    acc[type].total++
    if (b.status?.toUpperCase() === 'OCCUPIED') acc[type].occupied++
    return acc
  }, {})

  // Last 5 admissions, newest first
  const recentAdmissions = [...admissions]
    .sort((a, b) => new Date(b.admissionDate) - new Date(a.admissionDate))
    .slice(0, 5)

  function wardSeverity(pct) {
    if (pct >= 95) return 'ward-critical'
    if (pct >= 85) return 'ward-heavy'
    if (pct >= 70) return 'ward-normal'
    return 'ward-optimal'
  }
  function wardLabel(pct) {
    if (pct >= 95) return 'CRITICAL'
    if (pct >= 85) return 'HEAVY'
    if (pct >= 70) return 'NORMAL'
    return 'OPTIMAL'
  }
  function wardBarColor(pct) {
    if (pct >= 95) return 'var(--danger)'
    if (pct >= 85) return 'var(--warning)'
    if (pct >= 70) return 'var(--primary)'
    return 'var(--success)'
  }

  function timeAgo(dateStr) {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  const roleLabel = isSuperAdmin ? 'Super Admin' : isHospitalAdmin ? 'Hospital Admin' : 'Public User'

  return (
    <div className="responsive-container">
      {/* Page Header */}
      <div className="page-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="header-row">
          <div className="breadcrumb">
            <span className="breadcrumb-root">Portal</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">Clinical Dashboard</span>
          </div>
          <div className="online-indicator">
            <span className="online-dot" />
            Online
          </div>
        </div>
      </div>

      {/* Role Tabs */}
      <div className="role-tabs" style={{ paddingLeft: 0, paddingRight: 0 }} role="tablist" aria-label="Role preview tabs">
        <button
          type="button"
          className={`role-tab${activeRoleTab === 'hospital' ? ' active' : ''}`}
          onClick={() => setActiveRoleTab('hospital')}
        >
          <Building2 size={13} /> Hospital Admin
        </button>
        <button
          type="button"
          className={`role-tab${activeRoleTab === 'super' ? ' active' : ''}`}
          onClick={() => setActiveRoleTab('super')}
        >
          <Shield size={13} /> Super Admin
        </button>
        <button
          type="button"
          className={`role-tab${activeRoleTab === 'public' ? ' active' : ''}`}
          onClick={() => setActiveRoleTab('public')}
        >
          <Globe size={13} /> Public
        </button>
      </div>

      {/* Critical Alert */}
      {showAlert && occupancyPct >= 80 && (
        <div className="alert-banner alert-danger mb-4" role="alert" aria-live="polite">
          <div className="alert-header">
            <div className="alert-title">
              <AlertTriangle size={15} />
              High Occupancy Alert
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px',
                background: 'var(--danger)', color: 'white', borderRadius: 'var(--radius-sm)',
              }}>
                {occupancyPct}%
              </span>
            </div>
            <button
              className="btn btn-sm btn-icon btn-secondary"
              onClick={() => setShowAlert(false)}
              aria-label="Dismiss alert"
              style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>
          <p className="alert-body">
            Bed occupancy has exceeded 80% threshold. {available} beds currently available.
            Review ward allocations and discharge readiness.
          </p>
          <div className="alert-actions">
            <button className="btn btn-sm btn-secondary" onClick={() => setShowAlert(false)}>Dismiss</button>
            <button className="btn btn-sm btn-danger" onClick={() => navigate('/beds')}>
              Review Beds →
            </button>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="error-banner mb-4" role="alert">
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>Failed to load data: {error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-center">
          <div className="spinner" />
          <span className="text-sm text-muted">Loading clinical data…</span>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Metric Cards Row */}
          <div className="metric-grid">
            {/* Total Census */}
            <div className="metric-card">
              <div className="metric-label">
                Total Census
                <div className="metric-icon" style={{ background: 'var(--primary-light)' }}>
                  <BedDouble size={14} color="var(--primary)" />
                </div>
              </div>
              <div className="metric-number">{total}</div>
              <div className="metric-sub">Total licensed beds</div>
              <div className="metric-trend metric-trend-up">
                <TrendingUp size={10} /> Live count
              </div>
            </div>

            {/* Occupied */}
            <div className="metric-card">
              <div className="metric-label">
                Occupied Beds
                <div className="metric-icon" style={{ background: 'var(--status-occupied-bg)' }}>
                  <Users size={14} color="var(--tertiary)" />
                </div>
              </div>
              <div className="metric-number">
                {occupied}
                <span style={{ fontSize: '0.9rem', color: 'var(--tertiary)', fontWeight: 700 }}>
                  {' '}{occupancyPct}%
                </span>
              </div>
              <div className="metric-sub">Active patient care</div>
              <div className={`metric-trend ${occupancyPct >= 85 ? 'metric-trend-down' : 'metric-trend-up'}`}>
                {occupancyPct >= 85 ? '● High Surge' : '● Normal'}
              </div>
            </div>

            {/* Available */}
            <div className="metric-card">
              <div className="metric-label">
                Available
                <div className="metric-icon" style={{ background: 'var(--success-light)' }}>
                  <CheckCircle2 size={14} color="var(--success)" />
                </div>
              </div>
              <div className="metric-number" style={{ color: 'var(--success)' }}>{available}</div>
              <div className="metric-sub">Ready for intake</div>
              <div className="metric-trend metric-trend-up">
                {availablePct}% open
              </div>
            </div>

            {/* Offline / Hold */}
            <div className="metric-card">
              <div className="metric-label">
                Offline / Hold
                <div className="metric-icon" style={{ background: 'var(--status-maintenance-bg)' }}>
                  <XCircle size={14} color="var(--danger)" />
                </div>
              </div>
              <div className="metric-number" style={{ color: 'var(--text-secondary)' }}>{offline}</div>
              <div className="metric-sub">Non-intake status</div>
              {offline > 0 && (
                <div style={{ fontSize: '0.7rem', marginTop: 4, display: 'flex', gap: 6 }}>
                  <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{reserved} Resv</span>
                  <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{maintenance} Maint</span>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Responsive Content Grid */}
          <div className="dashboard-content-grid">
            {/* Left Main Column: Capacity + Wards + Executive Actions */}
            <div className="dashboard-main-col">
              {/* Capacity Distribution */}
              <div className="capacity-section mb-4" style={{ padding: 0 }}>
                <div className="card card-padded">
                  <div className="capacity-header mb-2">
                    <div>
                      <div className="capacity-title">Capacity Distribution</div>
                      <div className="capacity-subtitle">Dynamic allocation matrix</div>
                    </div>
                    <div className="capacity-count">{occupied} / {total}</div>
                  </div>

                  <div className="stacked-bar" role="img" aria-label={`Bed capacity: ${occupied} occupied, ${available} available, ${reserved} reserved, ${maintenance} maintenance`}>
                    {occupied > 0 && (
                      <div className="stacked-bar-segment"
                        style={{ width: `${occupancyPct}%`, background: 'var(--tertiary)' }}
                      />
                    )}
                    {available > 0 && (
                      <div className="stacked-bar-segment"
                        style={{ width: `${availablePct}%`, background: 'var(--success)' }}
                      />
                    )}
                    {reserved > 0 && (
                      <div className="stacked-bar-segment"
                        style={{ width: `${reservedPct}%`, background: 'var(--warning)' }}
                      />
                    )}
                    {maintenance > 0 && (
                      <div className="stacked-bar-segment"
                        style={{ width: `${maintPct}%`, background: 'var(--danger)' }}
                      />
                    )}
                  </div>

                  <div className="bar-legend">
                    <div className="bar-legend-item">
                      <div className="legend-dot" style={{ background: 'var(--tertiary)' }} />
                      Occupied ({occupancyPct}%)
                    </div>
                    <div className="bar-legend-item">
                      <div className="legend-dot" style={{ background: 'var(--success)' }} />
                      Available ({availablePct}%)
                    </div>
                    {reservedPct > 0 && (
                      <div className="bar-legend-item">
                        <div className="legend-dot" style={{ background: 'var(--warning)' }} />
                        Reserved ({reservedPct}%)
                      </div>
                    )}
                    {maintPct > 0 && (
                      <div className="bar-legend-item">
                        <div className="legend-dot" style={{ background: 'var(--danger)' }} />
                        Maint ({maintPct}%)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Ward Breakdown (by bed type) */}
              {Object.keys(byType).length > 0 && (
                <div className="section mb-4" style={{ padding: 0 }}>
                  <div className="section-header">
                    <div className="section-title">Ward Distribution</div>
                    <div className="section-subtitle">By bed type</div>
                  </div>
                  <div className="card">
                    {Object.entries(byType).map(([type, data]) => {
                      const pct = data.total > 0 ? Math.round((data.occupied / data.total) * 100) : 0
                      const free = data.total - data.occupied
                      return (
                        <div key={type} className="ward-item">
                          <div className="ward-header">
                            <div className="ward-name">
                              <BedDouble size={14} color="var(--primary)" />
                              {type}
                            </div>
                            <div className={`ward-pct-badge ${wardSeverity(pct)}`}>
                              {pct}% • {wardLabel(pct)}
                            </div>
                          </div>
                          <div className="ward-bar">
                            <div className="ward-bar-fill" style={{ width: `${pct}%`, background: wardBarColor(pct) }} />
                          </div>
                          <div className="ward-info">
                            <span>Occupied: {data.occupied} / {data.total}</span>
                            <span>{free} Beds Free</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Executive Actions */}
              <div className="section mb-4" style={{ padding: 0 }}>
                <div className="section-header">
                  <div className="section-title">Executive Actions</div>
                  <div className="text-muted text-xs">Fast dispatch</div>
                </div>
                <div className="action-grid">
                  <div className="action-card primary-action" onClick={() => setShowAdmitModal(true)} role="button" tabIndex={0} aria-label="Admit Patient">
                    <div className="action-card-icon">
                      <UserPlus size={20} color="white" />
                    </div>
                    <div className="action-card-label">Admit Patient</div>
                    <div className="action-card-sub">Triage assignment</div>
                  </div>
                  <div className="action-card" onClick={() => navigate('/beds')} role="button" tabIndex={0} aria-label="Go to Bed Matrix">
                    <div className="action-card-icon">
                      <BedDouble size={20} />
                    </div>
                    <div className="action-card-label">Bed Matrix</div>
                    <div className="action-card-sub" style={{ color: 'var(--text-muted)' }}>View all beds</div>
                  </div>
                  <div className="action-card" onClick={() => navigate('/patients')} role="button" tabIndex={0} aria-label="View Patient Census">
                    <div className="action-card-icon">
                      <FileText size={20} />
                    </div>
                    <div className="action-card-label">Patient Census</div>
                    <div className="action-card-sub" style={{ color: 'var(--text-muted)' }}>View admissions</div>
                  </div>
                  <div className="action-card" role="button" tabIndex={0} aria-label="Transfer Request - Coming Soon">
                    <div className="action-card-icon">
                      <ArrowLeftRight size={20} />
                    </div>
                    <div className="action-card-label">Transfer Req.</div>
                    <div className="action-card-sub" style={{ color: 'var(--text-muted)' }}>Coming soon</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Column: Hospital Overview & Recent Admissions */}
            <div className="dashboard-side-col">
              {/* Hospital info card */}
              <div className="mb-4">
                <div className="card card-padded flex items-center gap-3">
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius)',
                    background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--border)', flexShrink: 0,
                  }}>
                    <Building2 size={20} color="var(--primary)" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      <span>Metro General Hospital</span>
                      <ChevronDown size={14} color="var(--text-muted)" />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>
                      Central Campus • Bldg A &amp; E
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)',
                    background: 'var(--primary-light)', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--primary-ring)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                    Live API: Spring Boot v3.2
                  </div>
                </div>
              </div>

              {/* Recent Admissions */}
              <div className="section mb-4" style={{ padding: 0 }}>
                <div className="section-header">
                  <div>
                    <div className="section-title">Recent Admissions</div>
                    <div className="section-subtitle">Real-time ward telemetry</div>
                  </div>
                  <button className="section-action" onClick={() => navigate('/patients')}>
                    View Census <ChevronRight size={14} />
                  </button>
                </div>

                {recentAdmissions.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <Users size={24} />
                    </div>
                    <div className="empty-state-title">No admissions yet</div>
                    <div className="empty-state-sub">Create the first admission to see it here.</div>
                  </div>
                ) : (
                  <div>
                    {recentAdmissions.map(adm => (
                      <div key={adm.id} className="card card-padded mb-2" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        {/* Bed number tag */}
                        <div style={{
                          width: 44, flexShrink: 0, textAlign: 'center',
                          background: 'var(--canvas)', border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)', padding: '4px 2px',
                        }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {adm.bed?.type?.slice(0, 4).toUpperCase() || 'BED'}
                          </div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            #{adm.bed?.id}
                          </div>
                        </div>

                        {/* Patient info */}
                        <div className="flex-1 min-w-0">
                          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }} className="truncate">
                            {adm.patient?.name || 'Unknown Patient'}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }} className="truncate">
                            {adm.bed?.hospital?.name || 'Hospital'} · {timeAgo(adm.admissionDate)}
                          </div>
                        </div>

                        {/* Status */}
                        <StatusBadge status={adm.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* New Admission Modal */}
      {showAdmitModal && (
        <NewAdmissionModal
          onClose={() => setShowAdmitModal(false)}
          onSuccess={() => { setShowAdmitModal(false); reload() }}
        />
      )}
    </div>
  )
}
