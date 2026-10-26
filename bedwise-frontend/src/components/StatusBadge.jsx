/**
 * StatusBadge — renders the correct colored pill for any bed/admission status.
 * Statuses are normalized to uppercase before matching.
 */
export default function StatusBadge({ status }) {
  if (!status) return null
  const s = status.toUpperCase()

  let className = 'badge '
  if (s === 'AVAILABLE')                               className += 'badge-available'
  else if (s === 'OCCUPIED')                           className += 'badge-occupied'
  else if (s === 'RESERVED')                           className += 'badge-reserved'
  else if (s === 'MAINTENANCE' || s === 'SANITIZING')  className += 'badge-maintenance'
  else if (s === 'ACTIVE')                             className += 'badge-active'
  else if (s === 'DISCHARGED')                         className += 'badge-discharged'
  else                                                  className += 'badge-discharged'

  // Dot prefix
  const dot = <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} aria-hidden="true" />

  return (
    <span className={className} role="status" aria-label={`Status: ${status}`}>
      {dot} {s === 'SANITIZING' ? 'MAINTENANCE' : s}
    </span>
  )
}
