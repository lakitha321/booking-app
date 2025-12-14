const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = data?.error
    const errMessage =
      typeof err === 'string'
        ? err
        : err?.message || err?.formErrors?.join(', ') || 'Request failed'
    throw new Error(errMessage)
  }
  return data
}

export async function loginUser(body) {
  return request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function registerUser(body) {
  return request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function fetchProfile(token) {
  return request('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function fetchModels(token) {
  return request('/models', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
}

export async function fetchSlots() {
  return request('/slots?active=true')
}
