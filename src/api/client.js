// В dev — прямой адрес бэкенда, в prod-сборке — тот же домен (проксирует nginx)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8000' : '')

export function imageUrl(filename) {
  return `${API_BASE_URL}/static/images/${filename}`
}

async function request(path, options) {
  const res = await fetch(`${API_BASE_URL}${path}`, options)
  return res
}

export const api = {
  getCollections: () => request('/api/collections/').then((r) => (r.ok ? r.json() : [])),
  getProducts: () => request('/api/products/').then((r) => (r.ok ? r.json() : [])),
  getProduct: (id) => request(`/api/products/${id}`).then((r) => (r.ok ? r.json() : null)),
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
  getImages: () => request('/api/uploads/images').then((r) => (r.ok ? r.json() : [])),
  deleteImage: (filename) => request(`/api/uploads/images/${encodeURIComponent(filename)}`, { method: 'DELETE' }),
}
