import { useEffect, useMemo, useState } from 'react'
import { createSlot, deleteSlot, fetchSlots, updateSlot } from './api'
import SlotForm from './components/SlotForm'
import SlotTable from './components/SlotTable'

function toIso(datetimeLocal) {
  return datetimeLocal ? new Date(datetimeLocal).toISOString() : ''
}

export default function App() {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState(null)

  const sortedSlots = useMemo(
    () => [...slots].sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)),
    [slots]
  )

  const loadSlots = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchSlots()
      setSlots(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSlots()
  }, [])

  const handleCreate = async (form) => {
    setSubmitting(true)
    setError('')
    try {
      const payload = { ...form, startDateTime: toIso(form.startDateTime), endDateTime: toIso(form.endDateTime) }
      const created = await createSlot(payload)
      setSlots((prev) => [...prev, created])
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (form) => {
    if (!editing) return
    setSubmitting(true)
    setError('')
    try {
      const payload = { ...form }
      if (payload.startDateTime) payload.startDateTime = toIso(payload.startDateTime)
      if (payload.endDateTime) payload.endDateTime = toIso(payload.endDateTime)
      const updated = await updateSlot(editing._id, payload)
      setSlots((prev) => prev.map((slot) => (slot._id === updated._id ? updated : slot)))
      setEditing(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this slot?')) return
    setError('')
    try {
      await deleteSlot(id)
      setSlots((prev) => prev.filter((slot) => slot._id !== id))
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="app-shell">
      <header>
        <div>
          <h1>Booking slots</h1>
          <p className="lead">Manage availability slots exposed by the Express API.</p>
        </div>
        <div className="status-line">
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }}></span>
          API base: <code>{import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}</code>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="grid two">
        <div className="card">
          <h2>{editing ? 'Edit slot' : 'Create slot'}</h2>
          <p className="helper">Fill in start and end times in your local timezone. </p>
          <SlotForm
            mode={editing ? 'edit' : 'create'}
            initialData={editing}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => setEditing(null)}
            submitting={submitting}
          />
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Existing slots</h2>
            <button className="btn secondary" onClick={loadSlots} disabled={loading}>
              {loading ? 'Refreshing…' : 'Reload'}
            </button>
          </div>
          <SlotTable slots={sortedSlots} onEdit={setEditing} onDelete={handleDelete} />
        </div>
      </div>
    </div>
  )
}
