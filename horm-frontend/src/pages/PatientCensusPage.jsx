import { useEffect, useState, useMemo } from 'react'
import { getAdmissions, dischargeAdmission } from '../api/admissions'
import { getPatients, createPatient } from '../api/patients'
import { getBeds } from '../api/beds'
import { createAdmission } from '../api/admissions'
import {
  Search, Users, ChevronLeft, ChevronRight, X,
  AlertTriangle, UserPlus, BedDouble, LogOut, RotateCcw
} from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import NewAdmissionModal from '../components/NewAdmissionModal'

const PAGE_SIZE = 10

export default function PatientCensusPage() {
  const [admissions, setAdmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [wardFilter, setWardFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState({})
  const [showAdmitModal, setShowAdmitModal] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const a = await getAdmissions()
      setAdmissions(a)
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Stats
  const activeAdmissions = admissions.filter(a => a.status?.toUpperCase() === 'ACTIVE')
  const dischargedCount  = admissions.filter(a => a.status?.toUpperCase() === 'DISCHARGED').length
  const totalCount       = admissions.length

  // Unique wards (hospital names)
  const wards = useMemo(() => {
    const names = [...new Set(admissions.map(a => a.bed?.hospital?.name).filter(Boolean))]
    return ['ALL', ...names]
  }, [admissions])

  // Filter + search
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return admissions.filter(a => {
      const matchWard = wardFilter === 'ALL' || a.bed?.hospital?.name === wardFilter
      const matchSearch = !q
        || (a.patient?.name || '').toLowerCase().includes(q)
        || String(a.id).includes(q)
        || (a.patient?.condition || '').toLowerCase().includes(q)
        || (a.bed?.type || '').toLowerCase().includes(q)
      return matchWard && matchSearch
    }).sort((a, b) => new Date(b.admissionDate) - new Date(a.admissionDate))
  }, [admissions, wardFilter, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Reset page when filter changes
  useMemo(() => setPage(1), [wardFilter, search])

  async function handleDischarge(admissionId) {
    setActionLoading(p => ({ ...p, [admissionId]: true }))
    try {
      await dischargeAdmission(admissionId)
      await load()
    } catch (e) {
      alert(e.response?.data?.message || 'Discharge failed')
    } finally {
      setActionLoading(p => { const n = { ...p }; delete n[admissionId]; return n })
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString('en-IN', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  function timeAgo(dateStr) {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ${mins % 60}m ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div className="responsive-container">
      {/* Header */}
      <div className="page-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="header-row">
          <div className="breadcrumb">
            <span className="breadcrumb-root">Portal</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">Patient Census</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowAdmitModal(true)}
              id="admit-patient-btn"
              style={{ height: 28, padding: '0 10px', fontSize: '0.75rem' }}
            >
              <UserPlus size={14} /> New Admission
            </button>
            <div className="online-indicator">
              <span className="online-dot" />
              Online
            </div>
          </div>
        </div>
      </div>

      {/* Census Summary */}
      <div className="mt-3">
        <div className="card card-padded">
          <div className="flex items-center justify-between mb-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.875rem' }}>
                Active Census &amp; Triage
              </span>
            </div>
            <div style={{
              fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px',
              background: 'var(--status-occupied-bg)', border: '1px solid var(--status-occupied-border)',
              color: 'var(--status-occupied-text)', borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <BedDouble size={11} /> {activeAdmissions.length} Active
            </div>
          </div>
          <div className="grid-3">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>In-Ward</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                {activeAdmissions.length}
              </div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--tertiary)', lineHeight: 1 }}>
                {totalCount}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Discharged</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)', lineHeight: 1 }}>
                {dischargedCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mt-3">
        <div className="search-wrapper">
          <Search size={15} className="search-icon" />
          <input
            id="patient-search"
            className="input input-search"
            placeholder="Filter by patient name, ID, condition…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            aria-label="Search patients"
          />
        </div>
      </div>

      {/* Ward Filter Tabs */}
      <div className="filter-pills" style={{ paddingLeft: 0, paddingRight: 0 }} role="tablist" aria-label="Filter by ward">
        {wards.map(w => (
          <button
            key={w}
            className={`pill${wardFilter === w ? ' active' : ''}`}
            onClick={() => { setWardFilter(w); setPage(1) }}
            role="tab"
            aria-selected={wardFilter === w}
            id={`ward-tab-${w}`}
          >
            {w === 'ALL' ? `All Wards (${totalCount})` : w}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner mb-3">
          <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
          <button className="btn btn-sm btn-secondary" onClick={load} style={{ marginLeft: 'auto' }}>
            <RotateCcw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-center">
          <div className="spinner" />
          <span className="text-sm text-muted">Loading patient census…</span>
        </div>
      )}

      {/* Admission Cards in Responsive Grid */}
      {!loading && !error && (
        <div className="pb-6">
          {paginated.length === 0 ? (
            <div className="empty-state mt-4">
              <div className="empty-state-icon"><Users size={24} /></div>
              <div className="empty-state-title">No admissions found</div>
              <div className="empty-state-sub">
                {search ? 'Try a different search term.' : 'No admissions match the selected ward.'}
              </div>
            </div>
          ) : (
            <div className="patient-census-grid">
              {paginated.map(adm => {
                const patient = adm.patient
                const bed = adm.bed
                const isActive = adm.status?.toUpperCase() === 'ACTIVE'
                const isDischarging = actionLoading[adm.id]

                return (
                  <div key={adm.id} className="admission-card">
                    <div className="admission-header">
                      {/* Patient photo avatar */}
                      <div className="patient-photo">
                        {getInitials(patient?.name)}
                      </div>

                      <div className="admission-info">
                        <div className="admission-name">
                          {patient?.name || 'Unknown Patient'}
                          {patient?.age ? (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                              ({patient.age})
                            </span>
                          ) : null}
                          <StatusBadge status={adm.status} />
                        </div>
                        <div className="admission-meta">
                          Admission #{adm.id}
                          {patient?.gender ? ` · ${patient.gender}` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Condition */}
                    {patient?.condition && (
                      <div className="detail-pill mb-2" style={{ display: 'inline-flex', marginTop: 4 }}>
                        <AlertTriangle size={11} color="var(--warning)" />
                        {patient.condition}
                      </div>
                    )}

                    {/* Bed / Ward detail */}
                    <div className="admission-detail-row">
                      <div className="detail-pill">
                        <BedDouble size={11} /> Bed #{bed?.id}
                      </div>
                      {bed?.type && (
                        <div className="detail-pill">
                          {bed.type}
                        </div>
                      )}
                      {bed?.hospital?.name && (
                        <div className="detail-pill" style={{ color: 'var(--primary)' }}>
                          {bed.hospital.name}
                        </div>
                      )}
                      <div className="detail-pill" style={{ marginLeft: 'auto', color: 'var(--text-faint)' }}>
                        {formatDate(adm.admissionDate)} · {timeAgo(adm.admissionDate)}
                      </div>
                    </div>

                    {/* Actions */}
                    {isActive && (
                      <div className="admission-actions">
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDischarge(adm.id)}
                          disabled={isDischarging}
                          id={`discharge-admission-${adm.id}`}
                        >
                          {isDischarging ? (
                            <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Discharging…</>
                          ) : (
                            <><LogOut size={13} /> Process Discharge</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, width: '100%', textAlign: 'center' }}>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} admissions
              </div>
              <button
                className="btn btn-secondary btn-sm btn-icon"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                id="pagination-prev"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pg = i + 1
                return (
                  <button
                    key={pg}
                    className={`btn btn-sm btn-icon${page === pg ? ' btn-primary' : ' btn-secondary'}`}
                    onClick={() => setPage(pg)}
                    id={`pagination-page-${pg}`}
                    aria-label={`Page ${pg}`}
                    aria-current={page === pg ? 'page' : undefined}
                  >
                    {pg}
                  </button>
                )
              })}
              {totalPages > 5 && <span style={{ color: 'var(--text-muted)' }}>…</span>}
              <button
                className="btn btn-secondary btn-sm btn-icon"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                id="pagination-next"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating New Admission button (Mobile Only) */}
      <button
        id="new-admission-fab"
        className="fab-mobile-only"
        onClick={() => setShowAdmitModal(true)}
        style={{
          position: 'fixed',
          bottom: 'calc(var(--tab-bar-height) + 16px)',
          right: 16,
          zIndex: 90,
          height: 48,
          padding: '0 20px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--primary)',
          color: 'white',
          border: 'none',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '0.875rem',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-lg)',
          transition: 'background 0.15s, transform 0.15s',
        }}
        onMouseOver={e => e.currentTarget.style.background = 'var(--primary-hover)'}
        onMouseOut={e => e.currentTarget.style.background = 'var(--primary)'}
        aria-label="New Admission"
      >
        <UserPlus size={18} />
        New Admission
      </button>

      {showAdmitModal && (
        <NewAdmissionModal
          onClose={() => setShowAdmitModal(false)}
          onSuccess={() => { setShowAdmitModal(false); load() }}
        />
      )}
    </div>
  )
}
