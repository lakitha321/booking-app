import React from 'react'
import { ClockIcon, EditIcon, NoteIcon, PowerIcon, TrashIcon } from '../icons'

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
            <th>Status</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr key={slot._id}>
              <td>{slot.model?.name || '—'}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ClockIcon size={16} /> {formatDate(slot.startDateTime)}
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ClockIcon size={16} /> {formatDate(slot.endDateTime)}
                </div>
              </td>
              <td>
                <span className={`badge ${slot.isActive ? 'green' : 'gray'}`}>
                  <PowerIcon size={14} /> {slot.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: slot.notes ? undefined : 'var(--text-secondary)' }}>
                  <NoteIcon size={14} /> {slot.notes || '—'}
                </div>
              </td>
              <td>
                <div className="row-actions">
                  <button className="btn secondary" onClick={() => onEdit(slot)}>
                    <EditIcon size={15} /> Edit
                  </button>
                  <button className="btn danger" onClick={() => onDelete(slot._id)}>
                    <TrashIcon size={15} /> Delete
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
