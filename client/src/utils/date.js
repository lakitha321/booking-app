export function toIso(datetimeLocal) {
  return datetimeLocal ? new Date(datetimeLocal).toISOString() : ''
}
