import { useEffect, useMemo, useState } from 'react'
import {
  createModel,
  createSlot,
  deleteModel,
  deleteSlot,
  fetchModels,
  fetchSlots,
  updateModel,
  updateSlot,
} from './api'
import ModelForm from './components/ModelForm'
import ModelTable from './components/ModelTable'
import SlotForm from './components/SlotForm'
import SlotTable from './components/SlotTable'

function toIso(datetimeLocal) {
  return datetimeLocal ? new Date(datetimeLocal).toISOString() : ''
}

export default function App() {
  const [page, setPage] = useState('slots')

  const [slots, setSlots] = useState([])
  const [models, setModels] = useState([])

  const [slotLoading, setSlotLoading] = useState(false)
  const [modelLoading, setModelLoading] = useState(false)

  const [slotError, setSlotError] = useState('')
  const [modelError, setModelError] = useState('')

  const [slotSubmitting, setSlotSubmitting] = useState(false)
  const [modelSubmitting, setModelSubmitting] = useState(false)

  const [editingSlot, setEditingSlot] = useState(null)
  const [editingModel, setEditingModel] = useState(null)

  const sortedSlots = useMemo(
    () => [...slots].sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)),
    [slots]
  )

  const sortedModels = useMemo(
    () => [...models].sort((a, b) => a.name.localeCompare(b.name)),
    [models]
  )

  const loadModels = async () => {
    setModelLoading(true)
    setModelError('')
    try {
      const data = await fetchModels()
      setModels(data)
    } catch (e) {
      setModelError(e.message)
    } finally {
      setModelLoading(false)
    }
  }

  const loadSlots = async () => {
    setSlotLoading(true)
    setSlotError('')
    try {
      const data = await fetchSlots()
      setSlots(data)
    } catch (e) {
      setSlotError(e.message)
    } finally {
      setSlotLoading(false)
    }
  }

  useEffect(() => {
    loadModels()
    loadSlots()
  }, [])

  const handleSlotCreate = async (form) => {
    setSlotSubmitting(true)
    setSlotError('')
    try {
      const payload = {
        ...form,
        startDateTime: toIso(form.startDateTime),
        endDateTime: toIso(form.endDateTime),
      }
      const created = await createSlot(payload)
      setSlots((prev) => [...prev, created])
      setEditingSlot(null)
    } catch (e) {
      setSlotError(e.message)
    } finally {
      setSlotSubmitting(false)
    }
  }

  const handleSlotUpdate = async (form) => {
    if (!editingSlot) return
    setSlotSubmitting(true)
    setSlotError('')
    try {
      const payload = { ...form }
      if (payload.startDateTime) payload.startDateTime = toIso(payload.startDateTime)
      if (payload.endDateTime) payload.endDateTime = toIso(payload.endDateTime)
      const updated = await updateSlot(editingSlot._id, payload)
      setSlots((prev) => prev.map((slot) => (slot._id === updated._id ? updated : slot)))
      setEditingSlot(null)
    } catch (e) {
      setSlotError(e.message)
    } finally {
      setSlotSubmitting(false)
    }
  }

  const handleSlotDelete = async (id) => {
    if (!confirm('Delete this slot?')) return
    setSlotError('')
    try {
      await deleteSlot(id)
      setSlots((prev) => prev.filter((slot) => slot._id !== id))
    } catch (e) {
      setSlotError(e.message)
    }
  }

  const handleModelCreate = async (form) => {
    setModelSubmitting(true)
    setModelError('')
    try {
      const created = await createModel(form)
      setModels((prev) => [...prev, created])
      setEditingModel(null)
    } catch (e) {
      setModelError(e.message)
    } finally {
      setModelSubmitting(false)
    }
  }

  const handleModelUpdate = async (form) => {
    if (!editingModel) return
    setModelSubmitting(true)
    setModelError('')
    try {
      const updated = await updateModel(editingModel._id, form)
      setModels((prev) => prev.map((model) => (model._id === updated._id ? updated : model)))
      setEditingModel(null)
    } catch (e) {
      setModelError(e.message)
    } finally {
      setModelSubmitting(false)
    }
  }

  const handleModelDelete = async (id) => {
    if (!confirm('Delete this model?')) return
    setModelError('')
    try {
      await deleteModel(id)
      setModels((prev) => prev.filter((model) => model._id !== id))
      setSlots((prev) => prev.filter((slot) => slot.model?._id !== id && slot.model !== id))
    } catch (e) {
      setModelError(e.message)
    }
  }

  return (
    <div className="app-shell">
      <header>
        <div>
          <h1>Booking admin</h1>
          <p className="lead">Manage models and their availability slots.</p>
        </div>
        <div className="status-line">
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }}></span>
          API base: <code>{import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}</code>
        </div>
      </header>

      <nav className="tabs">
        <button className={page === 'slots' ? 'tab active' : 'tab'} onClick={() => setPage('slots')}>
          Availability slots
        </button>
        <button className={page === 'models' ? 'tab active' : 'tab'} onClick={() => setPage('models')}>
          Models
        </button>
      </nav>

      {page === 'slots' && (
        <div className="grid two">
          <div className="card">
            <h2>{editingSlot ? 'Edit slot' : 'Create slot'}</h2>
            <p className="helper">Pick a model and fill in start and end times in your local timezone.</p>
            {slotError && <div className="error">{slotError}</div>}
            <SlotForm
              mode={editingSlot ? 'edit' : 'create'}
              initialData={editingSlot}
              onSubmit={editingSlot ? handleSlotUpdate : handleSlotCreate}
              onCancel={() => setEditingSlot(null)}
              submitting={slotSubmitting}
              models={sortedModels}
            />
            {!sortedModels.length && (
              <p className="helper" style={{ marginTop: 8 }}>
                Create a model first to add availability.
              </p>
            )}
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Existing slots</h2>
              <button className="btn secondary" onClick={loadSlots} disabled={slotLoading}>
                {slotLoading ? 'Refreshing…' : 'Reload'}
              </button>
            </div>
            {slotError && <div className="error">{slotError}</div>}
            <SlotTable slots={sortedSlots} onEdit={setEditingSlot} onDelete={handleSlotDelete} />
          </div>
        </div>
      )}

      {page === 'models' && (
        <div className="grid two">
          <div className="card">
            <h2>{editingModel ? 'Edit model' : 'Create model'}</h2>
            <p className="helper">Model name is required and must be unique.</p>
            {modelError && <div className="error">{modelError}</div>}
            <ModelForm
              mode={editingModel ? 'edit' : 'create'}
              initialData={editingModel}
              onSubmit={editingModel ? handleModelUpdate : handleModelCreate}
              onCancel={() => setEditingModel(null)}
              submitting={modelSubmitting}
            />
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Models</h2>
              <button className="btn secondary" onClick={loadModels} disabled={modelLoading}>
                {modelLoading ? 'Refreshing…' : 'Reload'}
              </button>
            </div>
            {modelError && <div className="error">{modelError}</div>}
            <ModelTable models={sortedModels} onEdit={setEditingModel} onDelete={handleModelDelete} />
          </div>
        </div>
      )}
    </div>
  )
}
