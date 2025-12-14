import React from 'react'

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
              <td>{model.name}</td>
              <td>{model.nic || '—'}</td>
              <td>{model.notes || '—'}</td>
              <td>
                <div className="row-actions">
                  <button className="btn secondary" onClick={() => onEdit(model)}>
                    Edit
                  </button>
                  <button className="btn danger" onClick={() => onDelete(model._id)}>
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
