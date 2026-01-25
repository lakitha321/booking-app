import React from 'react'
import { EditIcon, TrashIcon, UsersIcon } from '../icons'

export default function SizeTable({ sizes, onEdit, onDelete }) {
  if (!sizes.length) {
    return <div className="empty-state">No sizes yet. Create one to get started.</div>
  }

  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sizes.map((size) => (
            <tr key={size._id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UsersIcon size={16} /> {size.name}
                </div>
              </td>
              <td>
                <div className="row-actions">
                  <button
                    className="btn secondary icon-only"
                    aria-label="Edit size"
                    onClick={() => onEdit(size)}
                  >
                    <EditIcon size={15} />
                  </button>
                  <button
                    className="btn ghost danger icon-only"
                    aria-label="Delete size"
                    onClick={() => onDelete(size._id)}
                  >
                    <TrashIcon size={15} />
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
