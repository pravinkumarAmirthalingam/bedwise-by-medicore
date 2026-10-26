import { useState, useEffect } from 'react'
import { getPatients, createPatient } from '../api/patients'
import { getBeds } from '../api/beds'
import { createAdmission } from '../api/admissions'
import { X, UserPlus, AlertTriangle, Plus } from 'lucide-react'

/**
 * NewAdmissionModal — two-step flow:
 *   1. Select or create a patient
 *   2. Select an available bed
 *   3. Submit → POST /api/admissions
 */
export default function NewAdmissionModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1)
  const [patients, setPatients] = useState([])
  const [availableBeds, setAvailableBeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Step 1 state
  const [selectedPatient, setSelectedPatient] = useState('')
  const [newPatientMode, setNewPatientMode] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAge, setNewAge] = useState('')
  const [newGender, setNewGender] = useState('Male')
  const [newCondition, setNewCondition] = useState('')

  // Step 2 state
  const [selectedBed, setSelectedBed] = useState('')
  const [createdPatientId, setCreatedPatientId] = useState(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [p, b] = await Promise.all([getPatients(), getBeds()])
        setPatients(p)
        setAvailableBeds(b.filter(bed => bed.status?.toUpperCase() === 'AVAILABLE'))
      } catch (e) {
        setError(e.response?.data?.message || e.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  async function handleStep1(e) {
    e.preventDefault()
    setError('')

    if (newPatientMode) {
      // Create patient first
      setSubmitting(true)
      try {
        const created = await createPatient({
          name: newName.trim(),
          age: Number(newAge),
          gender: newGender,
          condition: newCondition.trim(),
        })
        setCreatedPatientId(created.id)
        setStep(2)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to create patient')
      } finally {
        setSubmitting(false)
      }
    } else {
      if (!selectedPatient) return
      setCreatedPatientId(Number(selectedPatient))
      setStep(2)
    }
  }

  async function handleStep2(e) {
    e.preventDefault()
    if (!selectedBed || !createdPatientId) return
    setSubmitting(true)
    setError('')
    try {
      await createAdmission(createdPatientId, Number(selectedBed))
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Admission failed')
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="new-admission-title">
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="flex items-center justify-between">
            <div>
              <div className="modal-title" id="new-admission-title">
                <UserPlus size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                {step === 1 ? 'Select Patient' : 'Select Bed'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Step {step} of 2 — New Admission
              </div>
            </div>
            <button className="btn btn-sm btn-icon btn-secondary" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                flex: 1, height: 3, borderRadius: 'var(--radius-full)',
                background: step >= s ? 'var(--primary)' : 'var(--border)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>

        {loading && (
          <div className="loading-center" style={{ padding: 'var(--space-8)' }}>
            <div className="spinner" />
          </div>
        )}

        {!loading && step === 1 && (
          <form className="modal-body" onSubmit={handleStep1} id="admission-step1-form">
            {error && (
              <div className="error-banner">
                <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            {/* Toggle: existing vs new patient */}
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                type="button"
                className={`btn btn-sm flex-1${!newPatientMode ? ' btn-primary' : ' btn-secondary'}`}
                onClick={() => setNewPatientMode(false)}
                id="select-existing-patient-btn"
              >
                Existing Patient
              </button>
              <button
                type="button"
                className={`btn btn-sm flex-1${newPatientMode ? ' btn-primary' : ' btn-secondary'}`}
                onClick={() => setNewPatientMode(true)}
                id="create-new-patient-btn"
              >
                <Plus size={13} /> New Patient
              </button>
            </div>

            {!newPatientMode ? (
              <div className="input-group">
                <label className="input-label" htmlFor="select-patient-dropdown">Select Existing Patient</label>
                <select
                  id="select-patient-dropdown"
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
                {patients.length === 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    No patients registered yet. Use "New Patient" to add one.
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="input-group">
                  <label className="input-label" htmlFor="new-patient-name">Full Name *</label>
                  <input id="new-patient-name" className="input" placeholder="Patient full name" value={newName} onChange={e => setNewName(e.target.value)} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="input-group">
                    <label className="input-label" htmlFor="new-patient-age">Age *</label>
                    <input id="new-patient-age" className="input" type="number" min="0" max="150" placeholder="Age" value={newAge} onChange={e => setNewAge(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="new-patient-gender">Gender</label>
                    <select id="new-patient-gender" className="input select" value={newGender} onChange={e => setNewGender(e.target.value)}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="new-patient-condition">Condition / Diagnosis</label>
                  <input id="new-patient-condition" className="input" placeholder="e.g. Acute Coronary Syndrome" value={newCondition} onChange={e => setNewCondition(e.target.value)} />
                </div>
              </>
            )}
          </form>
        )}

        {!loading && step === 2 && (
          <form className="modal-body" onSubmit={handleStep2} id="admission-step2-form">
            {error && (
              <div className="error-banner">
                <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            {availableBeds.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-6) 0' }}>
                <div className="empty-state-title">No Available Beds</div>
                <div className="empty-state-sub">All beds are currently occupied, reserved, or under maintenance.</div>
              </div>
            ) : (
              <div className="input-group">
                <label className="input-label" htmlFor="select-bed-dropdown">Available Bed</label>
                <select
                  id="select-bed-dropdown"
                  className="input select"
                  value={selectedBed}
                  onChange={e => setSelectedBed(e.target.value)}
                  required
                >
                  <option value="">— Choose a bed —</option>
                  {availableBeds.map(b => (
                    <option key={b.id} value={b.id}>
                      Bed #{b.id} · {b.type || 'General'} · {b.hospital?.name || 'Hospital'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </form>
        )}

        <div className="modal-footer">
          {step === 1 ? (
            <>
              <button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
              <button
                className="btn btn-primary"
                type="submit"
                form="admission-step1-form"
                disabled={submitting || (!newPatientMode && !selectedPatient) || (newPatientMode && (!newName.trim() || !newAge))}
                id="admission-next-btn"
              >
                {submitting ? 'Creating…' : 'Next →'}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => setStep(1)} type="button">← Back</button>
              <button
                className="btn btn-primary"
                type="submit"
                form="admission-step2-form"
                disabled={submitting || !selectedBed || availableBeds.length === 0}
                id="admission-confirm-btn"
              >
                {submitting ? (
                  <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Admitting…</>
                ) : (
                  'Admit Patient'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
