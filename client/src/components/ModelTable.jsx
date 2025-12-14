import React from 'react'
import { EditIcon, NoteIcon, TrashIcon, UsersIcon } from '../icons'

export default function ModelTable({ models, onEdit, onDelete }) {
  if (!models.length) {
    return <div className="empty-state">No models yet. Create one to get started.</div>
  }

  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>NIC</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {models.map((model) => (
            <tr key={model._id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UsersIcon size={16} /> {model.name}
                </div>
              </td>
              <td>{model.nic || '—'}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: model.notes ? undefined : 'var(--text-secondary)' }}>
                  <NoteIcon size={14} /> {model.notes || '—'}
                </div>
              </td>
              <td>
                <div className="row-actions">
                  <button className="btn secondary" onClick={() => onEdit(model)}>
                    <EditIcon size={15} /> Edit
                  </button>
                  <button className="btn danger" onClick={() => onDelete(model._id)}>
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
