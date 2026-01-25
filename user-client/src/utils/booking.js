export function toDatetimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  const tzOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
}

export function toIso(value) {
  return value ? new Date(value).toISOString() : ''
}

export function minutesBetween(start, end) {
  return Math.max(0, Math.round((end - start) / 60000))
}

export function formatDuration(minutes) {
  if (minutes <= 0) return 'No time left'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (!hours) return `${mins} min${mins === 1 ? '' : 's'}`
  if (!mins) return `${hours} hr${hours === 1 ? '' : 's'}`
  return `${hours} hr${hours === 1 ? '' : 's'} ${mins} min${mins === 1 ? '' : 's'}`
}

export function formatTimeRange(start, end, withDate = false) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const sameDay = startDate.toDateString() === endDate.toDateString()
  const timeOptions = { hour: 'numeric', minute: '2-digit', second: '2-digit' }
  const startLabel = withDate ? startDate.toLocaleString() : startDate.toLocaleTimeString(undefined, timeOptions)
  const endLabel = withDate
    ? sameDay
      ? endDate.toLocaleTimeString(undefined, timeOptions)
      : endDate.toLocaleString()
    : endDate.toLocaleTimeString(undefined, timeOptions)
  return `${startLabel} → ${endLabel}`
}

export function formatModelLabel(model) {
  if (!model) return 'Model'
  if (typeof model === 'string') return model
  if (!model.name) return 'Model'
  return `${model.name}${model.size?.name ? ` - ${model.size.name}` : ''}`
}

export function buildAvailableWindows(slot, ignoreReservationId) {
  if (!slot) return []
  const slotStart = new Date(slot.startDateTime)
  const slotEnd = new Date(slot.endDateTime)

  const reservations = [...(slot.reservations || [])]
    .filter((res) => (res._id || '').toString() !== (ignoreReservationId || '').toString())
    .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))

  const windows = []
  let cursor = slotStart

  reservations.forEach((res) => {
    const resStart = new Date(res.startDateTime)
    const resEnd = new Date(res.endDateTime)
    if (resStart > cursor) {
      windows.push({ start: cursor, end: resStart })
    }
    if (resEnd > cursor) cursor = resEnd
  })

  if (cursor < slotEnd) {
    windows.push({ start: cursor, end: slotEnd })
  }

  return windows
}

export function remainingMinutesForSlot(slot) {
  if (!slot) return 0
  const start = new Date(slot.startDateTime)
  const end = new Date(slot.endDateTime)
  const total = minutesBetween(start, end)
  const reserved = (slot.reservations || []).reduce((sum, res) => {
    const resStart = new Date(res.startDateTime)
    const resEnd = new Date(res.endDateTime)
    return sum + minutesBetween(resStart, resEnd)
  }, 0)
  return Math.max(0, total - reserved)
}
