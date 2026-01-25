import { useEffect, useState } from 'react'
import { UsersIcon } from '../icons'

export default function SizeForm({ onSubmit, onCancel, initialData = null, submitting, mode, resetSignal }) {
  const [form, setForm] = useState({ name: '' })

  useEffect(() => {
    if (initialData) {
      setForm({ name: initialData.name || '' })
    } else {
      setForm({ name: '' })
    }
  }, [initialData, resetSignal])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...form })
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="form-row">
        <label htmlFor="name">
          <UsersIcon size={16} /> Size name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Unique size name"
          value={form.name}
          onChange={handleChange}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create size'}
        </button>
        {mode === 'edit' && (
          <button className="btn secondary" type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
