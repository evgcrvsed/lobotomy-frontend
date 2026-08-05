// В dev — прямой адрес бэкенда, в prod-сборке — тот же домен (проксирует nginx)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8000' : '')

export function imageUrl(filename) {
  return `${API_BASE_URL}/static/images/${filename}`
}

import { getToken } from '../auth'

async function request(path, options = {}) {
  const token = getToken()
  const headers = { ...(options.headers ?? {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  return res
}

export const api = {
  getCollections: () => request('/api/collections/').then((r) => (r.ok ? r.json() : [])),
  getProducts: () => request('/api/products/').then((r) => (r.ok ? r.json() : [])),
  getProduct: (id) => request(`/api/products/${id}`).then((r) => (r.ok ? r.json() : null)),
  getProductBySlug: (slug) =>
    request(`/api/products/slug/${encodeURIComponent(slug)}`).then((r) => (r.ok ? r.json() : null)),
  createProduct: (data) =>
    request('/api/products/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  updateProduct: (id, data) =>
    request(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteProduct: (id) => request(`/api/products/${id}`, { method: 'DELETE' }),
  uploadImage: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return request('/api/uploads/image', { method: 'POST', body: fd })
  },
  createCollection: (data) =>
    request('/api/collections/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  updateCollection: (id, data) =>
    request(`/api/collections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteCollection: (id) => request(`/api/collections/${id}`, { method: 'DELETE' }),
  vkLogin: (accessToken) =>
    request('/api/auth/vk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken }),
    }),
  requestEmailCode: (email) =>
    request('/api/auth/email/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }),
  verifyEmailCode: (email, code) =>
    request('/api/auth/email/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    }),
  getMe: () => request('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
  updateMe: (data) =>
    request('/api/auth/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  getImages: () => request('/api/uploads/images').then((r) => (r.ok ? r.json() : [])),
  deleteImage: (filename) => request(`/api/uploads/images/${encodeURIComponent(filename)}`, { method: 'DELETE' }),
  createOrder: (data) =>
    request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  trackOrder: (number) => request(`/api/orders/track/${encodeURIComponent(number)}`),
  getMyOrders: () => request('/api/orders/my').then((r) => (r.ok ? r.json() : [])),
  resumePayment: (number) => request(`/api/orders/${encodeURIComponent(number)}/pay`, { method: 'POST' }),
  // Возвращает { order, denied }: 403 надо отличать от 404 — заказ существует,
  // но привязан к аккаунту, и человеку нужно предложить вход, а не «не найдено»
  getOrder: (number) =>
    request(`/api/orders/${encodeURIComponent(number)}`).then(async (r) => ({
      order: r.ok ? await r.json() : null,
      denied: r.status === 403,
    })),
  // при недоступном бэкенде — пустой объект, страницы подставят свои умолчания
  getSettings: () => request('/api/settings/').then((r) => (r.ok ? r.json() : {})),
  updateSetting: (key, value) =>
    request(`/api/settings/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    }),
  getDeliveryMethods: () => request('/api/delivery/').then((r) => (r.ok ? r.json() : [])),
  updateDeliveryMethod: (code, data) =>
    request(`/api/delivery/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  getAllOrders: () => request('/api/orders').then((r) => (r.ok ? r.json() : [])),
  adminUpdateOrder: (number, data) =>
    request(`/api/orders/${encodeURIComponent(number)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  setOrderTracking: (number, trackingNumber) =>
    request(`/api/orders/${encodeURIComponent(number)}/tracking`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracking_number: trackingNumber }),
    }),
  // не дожидаясь фонового опроса
  syncOrderCdek: (number) =>
    request(`/api/orders/${encodeURIComponent(number)}/cdek-sync`, { method: 'POST' }),
}
