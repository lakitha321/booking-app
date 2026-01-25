const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || 'http://localhost:5000/api';

async function handleResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const message = typeof data === 'string' ? data : data?.error || 'Request failed';
    throw new Error(message);
  }
  return data;
}

export async function fetchSlots() {
  const res = await fetch(`${API_BASE}/slots`);
  return handleResponse(res);
}

export async function createSlot(payload) {
  const res = await fetch(`${API_BASE}/slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateSlot(id, payload) {
  const res = await fetch(`${API_BASE}/slots/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteSlot(id) {
  const res = await fetch(`${API_BASE}/slots/${id}`, { method: 'DELETE' });
  return handleResponse(res);
}

export async function fetchReservations() {
  const res = await fetch(`${API_BASE}/reservations`);
  return handleResponse(res);
}

export async function createReservation(payload) {
  const res = await fetch(`${API_BASE}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateReservation(id, payload) {
  const res = await fetch(`${API_BASE}/reservations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteReservation(id) {
  const res = await fetch(`${API_BASE}/reservations/${id}`, { method: 'DELETE' });
  return handleResponse(res);
}

export async function fetchModels() {
  const res = await fetch(`${API_BASE}/models`);
  return handleResponse(res);
}

export async function createModel(payload) {
  const res = await fetch(`${API_BASE}/models`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateModel(id, payload) {
  const res = await fetch(`${API_BASE}/models/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteModel(id) {
  const res = await fetch(`${API_BASE}/models/${id}`, { method: 'DELETE' });
  return handleResponse(res);
}

export async function fetchSizes() {
  const res = await fetch(`${API_BASE}/sizes`);
  return handleResponse(res);
}

export async function createSize(payload) {
  const res = await fetch(`${API_BASE}/sizes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateSize(id, payload) {
  const res = await fetch(`${API_BASE}/sizes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteSize(id) {
  const res = await fetch(`${API_BASE}/sizes/${id}`, { method: 'DELETE' });
  return handleResponse(res);
}
