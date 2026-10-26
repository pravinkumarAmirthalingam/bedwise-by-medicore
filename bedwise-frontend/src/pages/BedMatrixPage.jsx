import { useEffect, useState, useMemo } from 'react'
import { getBeds, createBed, deleteBed } from '../api/beds'
import { getAdmissions, dischargeAdmission, createAdmission } from '../api/admissions'
import { getPatients } from '../api/patients'
import { getHospitals } from '../api/hospitals'
import { useAuth } from '../context/AuthContext'
import {
  Search, BedDouble, CheckCircle2, XCircle, Clock, Wrench, X,
  AlertTriangle, UserPlus, RotateCcw, Plus, Trash2
} from 'lucide-react'
import StatusBadge from '../components/StatusBadge'

const STATUS_FILTERS = ['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE']

export default function BedMatrixPage() {
  const { isSuperAdmin } = useAuth()
  const [beds, setBeds] = useState([])
  const [admissions, setAdmissions] = useState([])
  const [patients, setPatients] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [actionLoading, setActionLoading] = useState({})
  const [showNewBed, setShowNewBed] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(null) // bedId

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [b, a, p] = await Promise.all([getBeds(), getAdmissions(), getPatients()])
      setBeds(b)
      setAdmissions(a)
      setPatients(p)
      if (isSuperAdmin) {
        const h = await getHospitals()
        setHospitals(h)
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Build a map: bedId → active admission
  const bedAdmissionMap = useMemo(() => {
    const map = {}
    admissions
      .filter(a => a.status?.toUpperCase() === 'ACTIVE')
      .forEach(a => { if (a.bed?.id) map[a.bed.id] = a })
    return map
  }, [admissions])

  // Unique bed types for filter tabs
  const bedTypes = useMemo(() => {
    const types = [...new Set(beds.map(b => b.type || 'General').filter(Boolean))]
    return ['ALL', ...types]
  }, [beds])

  // Filtered beds
  const filteredBeds = useMemo(() => {
    return beds.filter(b => {
      const type = b.type || 'General'
      const matchType = typeFilter === 'ALL' || type === typeFilter
      const status = b.status?.toUpperCase() || ''
      const matchStatus = statusFilter === 'ALL'
        || status === statusFilter
        || (statusFilter === 'MAINTENANCE' && ['MAINTENANCE', 'SANITIZING'].includes(status))
      const q = search.toLowerCase()
      const matchSearch = !q
        || String(b.id).includes(q)
        || type.toLowerCase().includes(q)
        || (bedAdmissionMap[b.id]?.patient?.name || '').toLowerCase().includes(q)
      return matchType && matchStatus && matchSearch
    })
  }, [beds, typeFilter, statusFilter, search, bedAdmissionMap])

  // Group by type
  const grouped = useMemo(() => {
    const groups = {}
    filteredBeds.forEach(b => {
      const type = b.type || 'General'
      if (!groups[type]) groups[type] = []
      groups[type].push(b)
    })
    return groups
  }, [filteredBeds])

  async function handleDischarge(admissionId, bedId) {
    setActionLoading(p => ({ ...p, [bedId]: 'discharging' }))
    try {
      await dischargeAdmission(admissionId)
      await load()
    } catch (e) {
      alert(e.response?.data?.message || 'Discharge failed')
    } finally {
      setActionLoading(p => { const n = { ...p }; delete n[bedId]; return n })
    }
  }

  async function handleAssign(bedId, patientId) {
    setActionLoading(p => ({ ...p, [bedId]: 'assigning' }))
    try {
      await createAdmission(patientId, bedId)
      setShowAssignModal(null)
      await load()
    } catch (e) {
      alert(e.response?.data?.message || 'Assignment failed')
    } finally {
      setActionLoading(p => { const n = { ...p }; delete n[bedId]; return n })
    }
  }

  async function handleDeleteBed(bedId) {
    if (!window.confirm(`Are you sure you want to delete Bed #${bedId}? This action cannot be undone.`)) return
    setActionLoading(p => ({ ...p, [bedId]: 'deleting' }))
    try {
      await deleteBed(bedId)
      await load()
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete bed')
    } finally {
      setActionLoading(p => { const n = { ...p }; delete n[bedId]; return n })
    }
  }

  const statusCounts = useMemo(() => ({
    total:       beds.length,
    available:   beds.filter(b => b.status?.toUpperCase() === 'AVAILABLE').length,
    occupied:    beds.filter(b => b.status?.toUpperCase() === 'OCCUPIED').length,
    reserved:    beds.filter(b => b.status?.toUpperCase() === 'RESERVED').length,
    maintenance: beds.filter(b => ['MAINTENANCE', 'SANITIZING'].includes(b.status?.toUpperCase())).length,
  }), [beds])

  const typeIcon = (type) => {
    const t = type?.toLowerCase() || ''
    if (t.includes('icu') || t.includes('intensive')) return '🏥'
    if (t.includes('emergency') || t.includes('trauma')) return '🚨'
    if (t.includes('surgery') || t.includes('surgical')) return '🔬'
    if (t.includes('pediatric') || t.includes('child')) return '👶'
    return '🛏️'
  }

  return (
    <div className="responsive-container">
      {/* Header */}
      <div className="page-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="header-row">
          <div className="breadcrumb">
            <span className="breadcrumb-root">Portal</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">Bed Matrix</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => setShowNewBed(true)} id="add-bed-btn" style={{ height: 28, padding: '0 10px', fontSize: '0.75rem' }}>
              <Plus size={14} /> New Bed
            </button>
            <div className="online-indicator">
              <span className="online-dot" />
              Online
            </div>
          </div>
        </div>
      </div>

      {/* Overview Banner */}
      <div className="mt-3">
        <div className="card card-padded">
          <div className="flex items-center justify-between mb-2">
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.875rem' }}>
              Full Matrix Overview
            </div>
            <div style={{
              fontSize: '0.75rem', fontWeight: 700,
              background: 'var(--primary-light)', color: 'var(--primary)',
              padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
            }}>
              {statusCounts.total > 0
                ? `${Math.round((statusCounts.occupied / statusCounts.total) * 100)}% Cap`
                : '0% Cap'}
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
            Active Capacity: {statusCounts.occupied} / {statusCounts.total} Beds &nbsp;·&nbsp;
            {statusCounts.available} Open Slots
          </div>
          {/* Mini stacked bar */}
          <div style={{ height: 6, borderRadius: 'var(--radius-full)', background: 'var(--border)', overflow: 'hidden', display: 'flex' }}>
            {statusCounts.total > 0 && (
              <>
                <div style={{ width: `${(statusCounts.occupied/statusCounts.total)*100}%`, background: 'var(--tertiary)' }} />
                <div style={{ width: `${(statusCounts.available/statusCounts.total)*100}%`, background: 'var(--success)' }} />
                <div style={{ width: `${(statusCounts.reserved/statusCounts.total)*100}%`, background: 'var(--warning)' }} />
                <div style={{ width: `${(statusCounts.maintenance/statusCounts.total)*100}%`, background: 'var(--danger)' }} />
              </>
            )}
          </div>
          <div className="flex gap-4 mt-2" style={{ flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              AVAILABLE {statusCounts.available}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--tertiary)', display: 'inline-block' }} />
              OCCUPIED {statusCounts.occupied}
            </span>
            {statusCounts.reserved > 0 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)', display: 'inline-block' }} />
                RESERVED {statusCounts.reserved}
              </span>
            )}
            {statusCounts.maintenance > 0 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }} />
                MAINTENANCE {statusCounts.maintenance}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mt-3">
        <div className="search-wrapper">
          <Search size={15} className="search-icon" />
          <input
            id="bed-search"
            className="input input-search"
            placeholder="Search by bed #, type, or patient name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search beds"
          />
        </div>
      </div>

      {/* Type Filter Tabs */}
      <div className="filter-pills" style={{ paddingLeft: 0, paddingRight: 0 }} role="tablist" aria-label="Filter by bed type">
        {bedTypes.map(type => (
          <button
            key={type}
            className={`pill${typeFilter === type ? ' active' : ''}`}
            onClick={() => setTypeFilter(type)}
            role="tab"
            aria-selected={typeFilter === type}
            id={`type-tab-${type}`}
          >
            {type === 'ALL' ? `All Wings (${beds.length})` : `${type} (${beds.filter(b => (b.type||'General') === type).length})`}
          </button>
        ))}
      </div>

      {/* Status Filter Pills */}
      <div className="flex gap-2 mb-3" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
        {STATUS_FILTERS.map(s => {
          const count = s === 'ALL' ? beds.length
            : s === 'AVAILABLE' ? statusCounts.available
            : s === 'OCCUPIED' ? statusCounts.occupied
            : s === 'RESERVED' ? statusCounts.reserved
            : statusCounts.maintenance
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              id={`status-filter-${s.toLowerCase()}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                height: 26, padding: '0 10px', borderRadius: 'var(--radius-full)',
                fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap',
                cursor: 'pointer', border: '1.5px solid',
                borderColor: statusFilter === s ? 'var(--primary)' : 'var(--border)',
                background: statusFilter === s ? 'var(--primary)' : 'var(--surface)',
                color: statusFilter === s ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
              aria-pressed={statusFilter === s}
            >
              {s} {count}
            </button>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner mx-4">
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          {error}
          <button className="btn btn-sm btn-secondary ml-auto" onClick={load} style={{ marginLeft: 'auto' }}>
            <RotateCcw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-center">
          <div className="spinner" />
          <span className="text-sm text-muted">Loading bed matrix…</span>
        </div>
      )}

      {/* Bed Matrix by Type Group */}
      {!loading && !error && (
        <div className="pb-4">
          {Object.keys(grouped).length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><BedDouble size={24} /></div>
              <div className="empty-state-title">No beds found</div>
              <div className="empty-state-sub">
                {search ? 'No results for your search.' : 'No beds match the selected filters.'}
              </div>
            </div>
          ) : (
            Object.entries(grouped).map(([type, typeBeds]) => (
              <div key={type} style={{ marginBottom: 'var(--space-4)' }}>
                {/* Group header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 'var(--space-2)', paddingBottom: 'var(--space-2)',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1rem' }}>{typeIcon(type)}</span>
                    {type} Cluster
                  </div>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px',
                    background: 'var(--canvas)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)',
                  }}>
                    {typeBeds.length} beds
                  </span>
                </div>

                {/* Bed cards in responsive matrix grid */}
                <div className="bed-matrix-grid">
                {typeBeds.map(bed => {
                  const activeAdm = bedAdmissionMap[bed.id]
                  const patient = activeAdm?.patient
                  const isLoading = !!actionLoading[bed.id]
                  const statusUp = bed.status?.toUpperCase() || 'AVAILABLE'

                  return (
                    <div key={bed.id} className="bed-card">
                      <div className="bed-card-header">
                        <div>
                          <div className="bed-number">
                            Bed #{bed.id} · {type}
                          </div>
                          <div className="bed-type-label">
                            {bed.hospital?.name || 'Hospital'} · {bed.hospital?.location || ''}
                          </div>
                        </div>
                        <StatusBadge status={statusUp} />
                      </div>

                      {/* Patient info if occupied */}
                      {patient && (
                        <div className="bed-patient-row">
                          <div className="patient-avatar">
                            {(patient.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="patient-name truncate">{patient.name}</div>
                            <div className="patient-meta">
                              {patient.gender} · Age {patient.age}
                              {patient.condition ? ` · ${patient.condition}` : ''}
                            </div>
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                            Adm. #{activeAdm.id}
                          </div>
                        </div>
                      )}

                      {/* AVAILABLE: empty state */}
                      {statusUp === 'AVAILABLE' && (
                        <div style={{
                          padding: 'var(--space-2) var(--space-3)',
                          background: 'var(--status-available-bg)',
                          borderRadius: 'var(--radius)',
                          border: '1px solid var(--status-available-border)',
                          marginBottom: 'var(--space-2)',
                          fontSize: '0.75rem',
                          color: 'var(--status-available-text)',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          <CheckCircle2 size={13} /> Ready for patient assignment
                        </div>
                      )}

                      {/* RESERVED state */}
                      {statusUp === 'RESERVED' && (
                        <div style={{
                          padding: 'var(--space-2) var(--space-3)',
                          background: 'var(--status-reserved-bg)',
                          borderRadius: 'var(--radius)',
                          border: '1px solid var(--status-reserved-border)',
                          marginBottom: 'var(--space-2)',
                          fontSize: '0.75rem',
                          color: 'var(--status-reserved-text)',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          <Clock size={13} /> Reserved — hold placed
                        </div>
                      )}

                      {/* MAINTENANCE state */}
                      {(statusUp === 'MAINTENANCE' || statusUp === 'SANITIZING') && (
                        <div style={{
                          padding: 'var(--space-2) var(--space-3)',
                          background: 'var(--status-maintenance-bg)',
                          borderRadius: 'var(--radius)',
                          border: '1px solid var(--status-maintenance-border)',
                          marginBottom: 'var(--space-2)',
                          fontSize: '0.75rem',
                          color: 'var(--status-maintenance-text)',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          <Wrench size={13} /> Under maintenance / sanitizing
                        </div>
                      )}

                      {/* Actions */}
                      <div className="bed-actions">
                        {statusUp === 'AVAILABLE' && (
                          <button
                            className="btn btn-primary btn-sm flex-1"
                            onClick={() => setShowAssignModal(bed)}
                            disabled={isLoading}
                            id={`assign-btn-${bed.id}`}
                          >
                            <UserPlus size={13} /> Assign Patient
                          </button>
                        )}
                        {statusUp === 'OCCUPIED' && activeAdm && (
                          <button
                            className="btn btn-danger btn-sm flex-1"
                            onClick={() => handleDischarge(activeAdm.id, bed.id)}
                            disabled={isLoading}
                            id={`discharge-btn-${bed.id}`}
                          >
                            {isLoading ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Discharging…</> : 'Discharge Patient'}
                          </button>
                        )}
                        {(statusUp === 'RESERVED' || statusUp === 'MAINTENANCE' || statusUp === 'SANITIZING') && (
                          <button className="btn btn-secondary btn-sm flex-1" disabled>
                            <XCircle size={13} /> Not assignable
                          </button>
                        )}
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => handleDeleteBed(bed.id)}
                          disabled={isLoading || statusUp === 'OCCUPIED'}
                          title={statusUp === 'OCCUPIED' ? 'Cannot delete an occupied bed' : `Delete Bed #${bed.id}`}
                          aria-label={`Delete Bed #${bed.id}`}
                          id={`delete-btn-${bed.id}`}
                          style={{ width: 30, height: 30, flexShrink: 0 }}
                        >
                          {actionLoading[bed.id] === 'deleting' ? (
                            <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Assign Patient Modal */}
      {showAssignModal && (
        <AssignPatientModal
          bed={showAssignModal}
          patients={patients.filter(p =>
            !Object.values(bedAdmissionMap).some(a => a.patient?.id === p.id)
          )}
          onAssign={(patientId) => handleAssign(showAssignModal.id, patientId)}
          onClose={() => setShowAssignModal(null)}
        />
      )}

      {/* New Bed Modal */}
      {showNewBed && (
        <NewBedModal
          hospitals={hospitals}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setShowNewBed(false)}
          onSuccess={async (data) => {
            try {
              await createBed(data)
              setShowNewBed(false)
              load()
            } catch (e) {
              alert(e.response?.data?.message || 'Failed to create bed')
            }
          }}
        />
      )}
    </div>
  )
}

/* ── Assign Patient Modal ── */
function AssignPatientModal({ bed, patients, onAssign, onClose }) {
  const [selectedPatient, setSelectedPatient] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedPatient) return
    setLoading(true)
    await onAssign(Number(selectedPatient))
    setLoading(false)
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="assign-modal-title">
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="flex items-center justify-between">
            <div className="modal-title" id="assign-modal-title">
              Assign Patient to Bed #{bed.id}
            </div>
            <button className="btn btn-sm btn-icon btn-secondary" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {bed.type} · {bed.hospital?.name}
          </div>
        </div>
        <form className="modal-body" onSubmit={handleSubmit} id="assign-patient-form">
          {patients.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No available patients</div>
              <div className="empty-state-sub">All registered patients are already admitted. Add a new patient first.</div>
            </div>
          ) : (
            <div className="input-group">
              <label className="input-label" htmlFor="assign-patient-select">Select Patient</label>
              <select
                id="assign-patient-select"
                className="input select"
                value={selectedPatient}
                onChange={e => setSelectedPatient(e.target.value)}
                required
              >
                <option value="">— Choose patient —</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} · Age {p.age} · {p.gender}
                  </option>
                ))}
              </select>
            </div>
          )}
        </form>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
          <button
            className="btn btn-primary"
            type="submit"
            form="assign-patient-form"
            disabled={loading || !selectedPatient || patients.length === 0}
            id="assign-confirm-btn"
          >
            {loading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Assigning…</> : 'Confirm Assignment'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── New Bed Modal ── */
function NewBedModal({ hospitals, isSuperAdmin, onClose, onSuccess }) {
  const [type, setType] = useState('')
  const [status, setStatus] = useState('AVAILABLE')
  const [hospitalId, setHospitalId] = useState(hospitals[0]?.id || '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!type.trim()) return
    setLoading(true)
    await onSuccess({
      type: type.trim(),
      status,
      hospital: { id: Number(hospitalId) },
    })
    setLoading(false)
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="new-bed-modal-title">
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="flex items-center justify-between">
            <div className="modal-title" id="new-bed-modal-title">Add New Bed</div>
            <button className="btn btn-sm btn-icon btn-secondary" onClick={onClose} aria-label="Close"><X size={16} /></button>
          </div>
        </div>
        <form className="modal-body" onSubmit={handleSubmit} id="new-bed-form">
          <div className="input-group">
            <label className="input-label" htmlFor="bed-type-input">Bed Type</label>
            <input id="bed-type-input" className="input" placeholder="e.g. ICU, Emergency, General" value={type} onChange={e => setType(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="bed-status-select">Initial Status</label>
            <select id="bed-status-select" className="input select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="AVAILABLE">Available</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>
          {isSuperAdmin && hospitals.length > 0 && (
            <div className="input-group">
              <label className="input-label" htmlFor="bed-hospital-select">Hospital</label>
              <select id="bed-hospital-select" className="input select" value={hospitalId} onChange={e => setHospitalId(e.target.value)}>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          )}
        </form>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
          <button className="btn btn-primary" type="submit" form="new-bed-form" disabled={loading || !type.trim()} id="new-bed-submit-btn">
            {loading ? 'Adding…' : 'Add Bed'}
          </button>
        </div>
      </div>
    </div>
  )
}
