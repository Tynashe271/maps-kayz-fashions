// Thin fetch wrapper around the Maps Kayz Fashions backend (NestJS, global
// prefix "/api"). Every function here maps 1:1 to a real backend endpoint —
// see backend/src/*/*.controller.ts for the source of truth.

// In dev, Vite proxies "/api" to the backend (see vite.config.js) so a bare
// relative path works. In production the frontend is static-hosted (Cloudflare
// Pages / GitHub Pages) separately from the backend VPS, so there's no proxy —
// VITE_API_BASE_URL must be set at build time to the backend's origin
// (e.g. https://api.mapskayz.com). Leave it unset for local dev.
const BASE = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api`

function authHeaders() {
  const token = localStorage.getItem('mk_token') || sessionStorage.getItem('mk_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function toQueryString(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  if (!entries.length) return ''
  return `?${new URLSearchParams(entries).toString()}`
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) Object.assign(headers, authHeaders())

  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Could not reach the server. Please check your connection and try again.')
  }

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message || res.statusText
    const error = new Error(message || `Request failed (${res.status})`)
    error.status = res.status
    throw error
  }
  return data
}

export const api = {
  // ---- auth ----
  register: (dto) => request('/auth/register', { method: 'POST', body: dto }),
  login: (dto) => request('/auth/login', { method: 'POST', body: dto }),

  // ---- products (GET public; write staff-only) ----
  listProducts: (params) => request(`/products${toQueryString(params)}`),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (dto) => request('/products', { method: 'POST', body: dto, auth: true }),
  updateProduct: (id, dto) => request(`/products/${id}`, { method: 'PATCH', body: dto, auth: true }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE', auth: true }),

  // ---- categories (GET public; write staff-only) ----
  listCategories: () => request('/categories'),
  getCategory: (id) => request(`/categories/${id}`),
  createCategory: (dto) => request('/categories', { method: 'POST', body: dto, auth: true }),
  updateCategory: (id, dto) => request(`/categories/${id}`, { method: 'PATCH', body: dto, auth: true }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE', auth: true }),

  // ---- customers (staff-only, all routes) ----
  listCustomers: () => request('/customers', { auth: true }),
  getCustomer: (id) => request(`/customers/${id}`, { auth: true }),
  createCustomer: (dto) => request('/customers', { method: 'POST', body: dto, auth: true }),
  updateCustomer: (id, dto) => request(`/customers/${id}`, { method: 'PATCH', body: dto, auth: true }),

  // ---- orders (list/detail/update staff-only; create is public) ----
  listOrders: () => request('/orders', { auth: true }),
  getOrder: (id) => request(`/orders/${id}`, { auth: true }),
  createOrder: (dto) => request('/orders', { method: 'POST', body: dto }),
  updateOrder: (id, dto) => request(`/orders/${id}`, { method: 'PATCH', body: dto, auth: true }),

  // ---- order tracking + customer self-service returns (public, email-verified) ----
  trackOrder: (orderNumber, email) => request(`/orders/track${toQueryString({ orderNumber, email })}`),
  requestOrderReturn: (orderId, dto) => request(`/orders/${orderId}/returns`, { method: 'POST', body: dto }),

  // ---- website → WhatsApp → payment workflow (public, email-verified) ----
  getOrderByNumber: (orderNumber, email) => request(`/orders/by-number/${orderNumber}${toQueryString({ email })}`),
  submitPaymentProof: (orderNumber, dto) => request(`/orders/${orderNumber}/payment-proof`, { method: 'POST', body: dto }),
  cancelOrder: (orderNumber, dto) => request(`/orders/${orderNumber}/cancel`, { method: 'POST', body: dto }),
  resendWhatsAppLink: (orderNumber) => request(`/orders/${orderNumber}/whatsapp-link`, { method: 'POST', auth: true }),
  regeneratePaymentLink: (orderNumber) => request(`/orders/${orderNumber}/payment-link`, { method: 'POST', auth: true }),
  getReceipt: (orderNumber, email) => request(`/orders/${orderNumber}/receipt${toQueryString({ email })}`),
  sendReceipt: (orderNumber) => request(`/admin/orders/${orderNumber}/send-receipt`, { method: 'POST', auth: true }),

  // ---- shopping carts (public, session-based via cart id) ----
  createCart: (dto = {}) => request('/carts', { method: 'POST', body: dto }),
  getCart: (id) => request(`/carts/${id}`),
  addCartItem: (id, dto) => request(`/carts/${id}/items`, { method: 'POST', body: dto }),
  updateCartItem: (id, itemId, dto) => request(`/carts/${id}/items/${itemId}`, { method: 'PATCH', body: dto }),
  removeCartItem: (id, itemId) => request(`/carts/${id}/items/${itemId}`, { method: 'DELETE' }),
  sendCartWhatsApp: (id, dto = {}) => request(`/carts/${id}/whatsapp`, { method: 'POST', body: dto }),

  // ---- whatsapp ----
  sendOrderMessage: (dto) => request('/whatsapp/order-message', { method: 'POST', body: dto }),
  getWhatsAppStatus: () => request('/whatsapp/status', { auth: true }),
  sendWhatsAppTestMessage: (dto) => request('/whatsapp/test-message', { method: 'POST', body: dto, auth: true }),

  // ---- promotions (GET public; write staff-only) ----
  listPromotions: () => request('/promotions'),
  createPromotion: (dto) => request('/promotions', { method: 'POST', body: dto, auth: true }),
  updatePromotion: (id, dto) => request(`/promotions/${id}`, { method: 'PATCH', body: dto, auth: true }),

  // ---- admin ----
  getDashboard: () => request('/admin/dashboard', { auth: true }),
  listAdminOrders: (params) => request(`/admin/orders${toQueryString(params)}`, { auth: true }),
  updateAdminOrderStatus: (orderNumber, dto) => request(`/admin/orders/${orderNumber}/status`, { method: 'PATCH', body: dto, auth: true }),
  verifyOrderPayment: (orderNumber, dto = {}) => request(`/admin/orders/${orderNumber}/verify-payment`, { method: 'POST', body: dto, auth: true }),

  // ---- authenticated customer dashboard ----
  getCustomerDashboard: () => request('/dashboard', { auth: true }),
  saveCustomerProfile: (dto) => request('/dashboard/profile', { method: 'POST', body: dto, auth: true }),
  createDashboardRecord: (resource, dto) => request(`/dashboard/${resource}`, { method: 'POST', body: dto, auth: true }),
  updateDashboardRecord: (resource, id, dto) => request(`/dashboard/${resource}/${id}`, { method: 'PATCH', body: dto, auth: true }),
  deleteDashboardRecord: (resource, id) => request(`/dashboard/${resource}/${id}`, { method: 'DELETE', auth: true }),
  getDeliveryQuote: (city) => request(`/dashboard/delivery/quote${toQueryString({ city })}`, { auth: true }),

  // ---- operations: inventory, deliveries, returns (all staff-only) ----
  listInventory: (branchId) => request(`/operations/inventory${toQueryString({ branchId })}`, { auth: true }),
  adjustStock: (dto) => request('/operations/inventory/adjust', { method: 'POST', body: dto, auth: true }),
  listStockMovements: (productId) => request(`/operations/inventory/movements${toQueryString({ productId })}`, { auth: true }),
  listDeliveries: () => request('/operations/deliveries', { auth: true }),
  createDelivery: (dto) => request('/operations/deliveries', { method: 'POST', body: dto, auth: true }),
  updateDelivery: (id, dto) => request(`/operations/deliveries/${id}`, { method: 'PATCH', body: dto, auth: true }),
  listReturns: () => request('/operations/returns', { auth: true }),
  createReturn: (dto) => request('/operations/returns', { method: 'POST', body: dto, auth: true }),
  updateReturn: (id, dto) => request(`/operations/returns/${id}`, { method: 'PATCH', body: dto, auth: true }),
  listLowStock: () => request('/operations/inventory/low-stock', { auth: true }),

  // ---- suppliers + supplier-product links (generic /platform/:resource CRUD) ----
  listSuppliers: () => request('/platform/suppliers'),
  createSupplier: (dto) => request('/platform/suppliers', { method: 'POST', body: { reference: `supplier:${Date.now()}`, data: dto }, auth: true }),
  updateSupplier: (id, dto) => request(`/platform/suppliers/${id}`, { method: 'PATCH', body: { data: dto }, auth: true }),
  deleteSupplier: (id) => request(`/platform/suppliers/${id}`, { method: 'DELETE', auth: true }),
  listSupplierProductMappings: () => request('/platform/supplier-product-mappings'),
  // One mapping per product — reference is the product id, so this looks
  // for an existing record first and updates it instead of creating a
  // second mapping for the same product (the DB enforces (resource,
  // reference) uniqueness, so a blind create would 500 on the second call).
  async setProductSupplier(productId, supplierId, dto = {}) {
    const data = { productId, supplierId, ...dto }
    const existing = await this.listSupplierProductMappings().then((rows) => rows.find((r) => r.reference === productId)).catch(() => null)
    if (existing) return request(`/platform/supplier-product-mappings/${existing.id}`, { method: 'PATCH', body: { data }, auth: true })
    return request('/platform/supplier-product-mappings', { method: 'POST', body: { reference: productId, data }, auth: true })
  },

  // ---- platform: generic flexible-resource CRUD (GET/detail public; write staff-only) ----
  platformSummary: () => request('/platform/summary'),
  platformCapabilities: () => request('/platform/capabilities'),
  listPlatformRecords: (resource) => request(`/platform/${resource}`),
  getPlatformRecord: (resource, id) => request(`/platform/${resource}/${id}`),
  createPlatformRecord: (resource, dto) => request(`/platform/${resource}`, { method: 'POST', body: dto, auth: true }),
  updatePlatformRecord: (resource, id, dto) => request(`/platform/${resource}/${id}`, { method: 'PATCH', body: dto, auth: true }),
  deletePlatformRecord: (resource, id) => request(`/platform/${resource}/${id}`, { method: 'DELETE', auth: true }),
}
