import { CalendarIcon, MailIcon, TrashIcon } from '../icons'

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
            <td>{reservation.model?.name || reservation.slot?.model?.name || 'Model'}</td>
            <td>
              <div className="pill">
                <CalendarIcon size={14} />
                <span>
                  {new Date(reservation.startDateTime).toLocaleString()} →{' '}
                  {new Date(reservation.endDateTime).toLocaleString()}
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
              <button className="btn tertiary" onClick={() => onEdit(reservation)}>
                Edit
              </button>
              <button className="btn ghost danger" onClick={() => onDelete(reservation._id)}>
                <TrashIcon size={14} /> Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
