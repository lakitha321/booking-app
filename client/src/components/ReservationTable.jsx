import { CalendarIcon, EditIcon, MailIcon, TrashIcon } from '../icons'

function formatTimeRange(start, end) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const sameDay = startDate.toDateString() === endDate.toDateString()
  const timeOptions = { hour: 'numeric', minute: '2-digit', second: '2-digit' }
  const startLabel = startDate.toLocaleString()
  const endLabel = sameDay ? endDate.toLocaleTimeString(undefined, timeOptions) : endDate.toLocaleString()
  return `${startLabel} → ${endLabel}`
}

export default function ReservationTable({ reservations = [], onEdit, onDelete }) {
  if (!reservations.length) return <p className="helper">No reservations yet.</p>

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Model</th>
          <th>Times</th>
          <th>User</th>
          <th>Notes</th>
          <th style={{ width: 160 }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {reservations.map((reservation) => (
          <tr key={reservation._id}>
            <td>
              {typeof reservation.model === 'string'
                ? reservation.model
                : reservation.model?.name ||
                  (typeof reservation.slot?.model === 'string' ? reservation.slot.model : reservation.slot?.model?.name) ||
                  'Model'}
            </td>
            <td>
              <div className="pill">
                <CalendarIcon size={14} />
                <span>
                  {formatTimeRange(reservation.startDateTime, reservation.endDateTime)}
                </span>
              </div>
            </td>
            <td>
              <div className="pill">
                <MailIcon size={14} /> {reservation.userEmail}
              </div>
            </td>
            <td className="mono">{reservation.notes || '—'}</td>
            <td className="actions">
              {onEdit && (
                <button className="btn tertiary icon-only" onClick={() => onEdit(reservation)} aria-label="Update reservation">
                  <EditIcon size={14} />
                </button>
              )}
              <button className="btn ghost danger icon-only" onClick={() => onDelete(reservation._id)} aria-label="Delete reservation">
                <TrashIcon size={14} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
