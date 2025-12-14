import React from 'react'

function formatDate(value) {
  const date = new Date(value)
  return date.toLocaleString()
}

export default function SlotTable({ slots, onEdit, onDelete }) {
  if (!slots.length) {
    return <div className="empty-state">No slots yet. Create one to get started.</div>
  }

  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            <th>Model</th>
            <th>Start</th>
            <th>End</th>
            <th>Active</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr key={slot._id}>
              <td>{slot.model?.name || '—'}</td>
              <td>{formatDate(slot.startDateTime)}</td>
              <td>{formatDate(slot.endDateTime)}</td>
              <td>
                <span className={`badge ${slot.isActive ? 'green' : 'gray'}`}>
                  {slot.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>{slot.notes || '—'}</td>
              <td>
                <div className="row-actions">
                  <button className="btn secondary" onClick={() => onEdit(slot)}>
                    Edit
                  </button>
                  <button className="btn danger" onClick={() => onDelete(slot._id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
