import AsyncStorage from '@react-native-async-storage/async-storage'

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://maps-kayz-backend.onrender.com/api'

async function request(path, options = {}) {
  const token = await AsyncStorage.getItem('mk_token')
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message
    throw new Error(message || `Request failed (${response.status})`)
  }
  return data
}

const json = (method, body) => ({ method, body: JSON.stringify(body) })

export const api = {
  products: () => request('/products'),
  categories: () => request('/categories'),
  login: (body) => request('/auth/login', json('POST', body)),
  register: (body) => request('/auth/register', json('POST', body)),
  dashboard: () => request('/dashboard'),
  createCart: () => request('/carts', json('POST', {})),
  cart: (id) => request(`/carts/${id}`),
  addToCart: (id, body) => request(`/carts/${id}/items`, json('POST', body)),
  updateCartItem: (id, itemId, quantity) => request(`/carts/${id}/items/${itemId}`, json('PATCH', { quantity })),
  removeCartItem: (id, itemId) => request(`/carts/${id}/items/${itemId}`, { method: 'DELETE' }),
  cartWhatsApp: (id) => request(`/carts/${id}/whatsapp`, json('POST', {})),
}
