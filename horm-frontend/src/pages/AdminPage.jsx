import { useEffect, useState, useMemo } from 'react'
import { getHospitals, getHospitalOccupancy, createHospital, updateHospital, deleteHospital } from '../api/hospitals'
import {
  Search, Plus, Settings, Users, FileText, Shield,
  MapPin, Phone, Building2, X, AlertTriangle, RotateCcw, Trash2, Edit3
} from 'lucide-react'

export default function AdminPage() {
  const [hospitals, setHospitals] = useState([])
  const [occupancies, setOccupancies] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('directory')
  const [showNewModal, setShowNewModal] = useState(false)
  const [editHospital, setEditHospital] = useState(null)
  const [actionLoading, setActionLoading] = useState({})

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const h = await getHospitals()
      setHospitals(h)
      // Fetch occupancy for each hospital in parallel
      const occupancyResults = await Promise.allSettled(
        h.map(hospital => getHospitalOccupancy(hospital.id))
      )
      const map = {}
      occupancyResults.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          map[h[i].id] = result.value
        }
      })
      setOccupancies(map)
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return hospitals.filter(h =>
      !q
      || h.name?.toLowerCase().includes(q)
      || h.location?.toLowerCase().includes(q)
      || h.phone?.toLowerCase().includes(q)
    )
  }, [hospitals, search])

  // Network-wide aggregates
  const totalHospitals = hospitals.length
  const totalBeds = Object.values(occupancies).reduce((s, o) => s + (o.totalBeds || 0), 0)
  const totalOccupied = Object.values(occupancies).reduce((s, o) => s + (o.occupiedBeds || 0), 0)
  const overallRate = totalBeds > 0 ? ((totalOccupied / totalBeds) * 100).toFixed(1) : 0

  async function handleCreate(data) {
    setActionLoading(p => ({ ...p, create: true }))
    try {
      await createHospital(data)
      setShowNewModal(false)
      load()
    } catch (e) {
      alert(e.response?.data?.message || 'Create failed')
    } finally {
      setActionLoading(p => { const n = { ...p }; delete n.create; return n })
    }
  }

  async function handleUpdate(id, data) {
    setActionLoading(p => ({ ...p, [id]: 'updating' }))
    try {
      await updateHospital(id, data)
      setEditHospital(null)
      load()
    } catch (e) {
      alert(e.response?.data?.message || 'Update failed')
    } finally {
      setActionLoading(p => { const n = { ...p }; delete n[id]; return n })
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this hospital? This cannot be undone.')) return
    setActionLoading(p => ({ ...p, [id]: 'deleting' }))
    try {
      await deleteHospital(id)
      load()
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed')
    } finally {
      setActionLoading(p => { const n = { ...p }; delete n[id]; return n })
    }
  }

  function progressColor(pct) {
    if (pct >= 90) return 'high'
    if (pct >= 75) return 'warn'
    return ''
  }

  return (
    <div className="responsive-container">
      {/* Header */}
      <div className="page-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="header-row">
          <div className="breadcrumb">
            <span className="breadcrumb-root">Portal</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">Admin Settings</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="onboard-hospital-header-btn"
              className="btn btn-primary btn-sm"
              onClick={() => setShowNewModal(true)}
              style={{ height: 28, padding: '0 10px', fontSize: '0.75rem' }}
            >
              <Plus size={14} /> Onboard Hospital
            </button>
            <div className="online-indicator"><span className="online-dot" />Online</div>
          </div>
        </div>
      </div>

      {/* Super Admin Banner */}
      <div className="super-admin-banner mt-3">
        <div className="super-admin-label">SUPER ADMINISTRATOR CONSOLE</div>
        <div className="super-admin-title">Network-Wide Overview ({totalHospitals} Hospitals)</div>
        <div className="super-admin-sub">
          Centralized orchestration, inter-hospital triage routing, and regional tenant controls.
        </div>
      </div>

      {/* Network Stats - 4 Cards Grid */}
      <div className="metric-grid mt-3">
        <div className="metric-card">
          <div className="metric-label">
            Hospitals
            <div className="metric-icon" style={{ background: 'var(--primary-light)' }}>
              <Building2 size={14} color="var(--primary)" />
            </div>
          </div>
          <div className="metric-number" style={{ color: 'var(--primary)' }}>{totalHospitals}</div>
          <div className="metric-sub">Facilities Active</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            Bed Capacity
            <div className="metric-icon" style={{ background: 'var(--status-occupied-bg)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tertiary)" strokeWidth="2"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/></svg>
            </div>
          </div>
          <div className="metric-number">{totalBeds.toLocaleString()}</div>
          <div className="metric-sub">
            {totalOccupied} In Use · {totalBeds - totalOccupied} Free
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            Network Occupancy
            <div className="metric-icon" style={{ background: overallRate >= 85 ? 'var(--danger-light)' : 'var(--success-light)' }}>
              <Shield size={14} color={overallRate >= 85 ? 'var(--danger)' : 'var(--success)'} />
            </div>
          </div>
          <div className="metric-number" style={{ color: overallRate >= 85 ? 'var(--danger)' : 'var(--text-primary)' }}>
            {overallRate}%
          </div>
          <div className="metric-sub">
            {overallRate >= 85 ? 'High Network Load' : 'Optimal Capacity'}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            System Telemetry
            <div className="metric-icon" style={{ background: 'var(--success-light)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            </div>
          </div>
          <div className="metric-number" style={{ color: 'var(--success)' }}>100%</div>
          <div className="metric-sub">All Services Healthy</div>
        </div>
      </div>

      {/* Onboard Button (Mobile Only) */}
      <div className="mobile-only mt-3">
        <button
          id="onboard-hospital-btn"
          className="btn btn-primary btn-full btn-lg"
          onClick={() => setShowNewModal(true)}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          <Plus size={18} /> Onboard New Hospital
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="filter-pills mt-3" style={{ paddingLeft: 0, paddingRight: 0 }} role="tablist">
        {[
          { id: 'directory', label: 'Facility Directory' },
          { id: 'rbac',      label: 'RBAC Access',       comingSoon: true },
          { id: 'audit',     label: 'Audit Logs',        comingSoon: true },
          { id: 'configs',   label: 'Configs',           comingSoon: true },
        ].map(tab => (
          <button
            key={tab.id}
            className={`pill${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            id={`admin-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Coming Soon tabs */}
      {activeTab !== 'directory' && (
        <div className="coming-soon-page" style={{ paddingTop: 'var(--space-6)' }}>
          <div className="coming-soon-badge">
            <Shield size={14} /> {activeTab === 'rbac' ? 'RBAC Access' : activeTab === 'audit' ? 'Audit Logs' : 'Configs'}
          </div>
          <div className="coming-soon-title">Coming Soon</div>
          <div className="coming-soon-sub">
            This administrative feature is under development and will be available in a future release.
          </div>
        </div>
      )}

      {/* Facility Directory */}
      {activeTab === 'directory' && (
        <>
          {/* Search */}
          <div className="mb-3">
            <div className="search-wrapper">
              <Search size={15} className="search-icon" />
              <input
                id="hospital-search"
                className="input input-search"
                placeholder="Search hospital by name, region, code…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search hospitals"
              />
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
              Facility Directory
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {totalHospitals} Tenancies
            </div>
          </div>

          {error && (
            <div className="error-banner mb-3">
              <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
              <button className="btn btn-sm btn-secondary" onClick={load} style={{ marginLeft: 'auto' }}>
                <RotateCcw size={12} /> Retry
              </button>
            </div>
          )}

          {loading && (
            <div className="loading-center">
              <div className="spinner" />
              <span className="text-sm text-muted">Loading hospitals…</span>
            </div>
          )}

          {!loading && !error && (
            <div className="pb-6">
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><Building2 size={24} /></div>
                  <div className="empty-state-title">No hospitals found</div>
                  <div className="empty-state-sub">Onboard the first hospital using the button above.</div>
                </div>
              ) : (
                <div className="hospital-directory-grid">
                  {filtered.map(hospital => {
                    const occ = occupancies[hospital.id]
                    const pct = occ?.occupancyRate || 0
                    const isDeleting = actionLoading[hospital.id] === 'deleting'

                    return (
                      <div key={hospital.id} className="hospital-card">
                        <div className="hospital-card-body">
                          {/* Name + type */}
                          <div className="hospital-name-row">
                            <div className="hospital-name">{hospital.name}</div>
                            <div className="hospital-type-badge">Facility</div>
                          </div>

                          {/* Meta */}
                          <div className="hospital-meta">
                            {hospital.location && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <MapPin size={11} /> {hospital.location}
                              </span>
                            )}
                            {hospital.phone && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Phone size={11} /> {hospital.phone}
                              </span>
                            )}
                            <span style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                              Operational
                            </span>
                          </div>

                          {/* Occupancy */}
                          {occ ? (
                            <>
                              <div className="hospital-occupancy-row">
                                <span>Bed Capacity ({occ.totalBeds} total)</span>
                                <span style={{ color: pct >= 90 ? 'var(--danger)' : pct >= 75 ? 'var(--warning)' : 'var(--text-secondary)' }}>
                                  {pct.toFixed(1)}% Occupied
                                </span>
                              </div>
                              <div className="hospital-progress">
                                <div
                                  className={`hospital-progress-fill ${progressColor(pct)}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <div className="hospital-stats-row">
                                <span>ID #{hospital.id}</span>
                                <span style={{ color: pct >= 90 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                  {occ.availableBeds} Beds Free
                                </span>
                              </div>
                            </>
                          ) : (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                              No bed data available
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="hospital-actions">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditHospital(hospital)}
                            disabled={isDeleting}
                            id={`edit-hospital-${hospital.id}`}
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            disabled
                            title="Coming soon"
                            id={`telemetry-hospital-${hospital.id}`}
                          >
                            <FileText size={12} /> Telemetry
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setEditHospital(hospital)}
                            disabled={isDeleting}
                            id={`configure-hospital-${hospital.id}`}
                          >
                            <Settings size={12} /> Configure
                          </button>
                          <button
                            className="btn btn-danger btn-sm btn-icon"
                            onClick={() => handleDelete(hospital.id)}
                            disabled={isDeleting}
                            id={`delete-hospital-${hospital.id}`}
                            aria-label={`Delete ${hospital.name}`}
                          >
                            {isDeleting ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : <Trash2 size={12} />}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Spring Security infra badge */}
          <div className="infra-badge mb-4">
            <span className="infra-dot" />
            Spring Security · Role: ROLE_SUPER_ADMIN · JWT Basic Auth
          </div>
        </>
      )}

      {/* New Hospital Modal */}
      {showNewModal && (
        <HospitalFormModal
          title="Onboard New Hospital"
          onClose={() => setShowNewModal(false)}
          onSubmit={handleCreate}
          loading={!!actionLoading.create}
          submitLabel="Onboard Hospital"
          submitId="onboard-hospital-submit"
        />
      )}

      {/* Edit Hospital Modal */}
      {editHospital && (
        <HospitalFormModal
          title={`Configure: ${editHospital.name}`}
          initial={editHospital}
          onClose={() => setEditHospital(null)}
          onSubmit={(data) => handleUpdate(editHospital.id, data)}
          loading={actionLoading[editHospital.id] === 'updating'}
          submitLabel="Save Changes"
          submitId="update-hospital-submit"
        />
      )}
    </div>
  )
}

/* ── Hospital Form Modal (Create & Edit) ── */
function HospitalFormModal({ title, initial = {}, onClose, onSubmit, loading, submitLabel, submitId }) {
  const [name, setName] = useState(initial.name || '')
  const [location, setLocation] = useState(initial.location || '')
  const [phone, setPhone] = useState(initial.phone || '')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), location: location.trim(), phone: phone.trim() })
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="hospital-modal-title">
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="flex items-center justify-between">
            <div className="modal-title" id="hospital-modal-title">{title}</div>
            <button className="btn btn-sm btn-icon btn-secondary" onClick={onClose} aria-label="Close"><X size={16} /></button>
          </div>
        </div>
        <form className="modal-body" onSubmit={handleSubmit} id="hospital-form">
          <div className="input-group">
            <label className="input-label" htmlFor="hospital-name-input">Hospital Name *</label>
            <input id="hospital-name-input" className="input" placeholder="e.g. Metro General Hospital" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="hospital-location-input">Location / Address</label>
            <input id="hospital-location-input" className="input" placeholder="e.g. East Campus, Metro District" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="hospital-phone-input">Phone Number</label>
            <input id="hospital-phone-input" className="input" type="tel" placeholder="e.g. +91-44-1234-5678" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </form>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
          <button className="btn btn-primary" type="submit" form="hospital-form" disabled={loading || !name.trim()} id={submitId}>
            {loading ? 'Saving…' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
