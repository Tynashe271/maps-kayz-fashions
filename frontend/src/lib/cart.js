import { reactive } from 'vue'
import { api } from './api'

const CART_KEY = 'mk_cart_id'

export const cartStore = reactive({
  id: localStorage.getItem(CART_KEY) || null,
  items: [],
  itemCount: 0,
  total: 0,
  ready: false,
})

function applyCart(cart) {
  cartStore.items = cart.items || []
  cartStore.itemCount = cart.itemCount ?? cartStore.items.reduce((sum, item) => sum + item.quantity, 0)
  cartStore.total = cart.total ?? cartStore.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  cartStore.ready = true
}

function persistCartId(id) {
  cartStore.id = id
  localStorage.setItem(CART_KEY, id)
}

// Ensures cartStore.id points at a real, existing cart — creating one if
// there isn't one yet, or the stored id no longer exists on the server.
export async function ensureCart() {
  if (cartStore.id) {
    try {
      const cart = await api.getCart(cartStore.id)
      applyCart(cart)
      return cartStore.id
    } catch {
      // Stored cart id is stale (e.g. database was reset) — fall through and create a new one.
    }
  }
  const cart = await api.createCart({})
  persistCartId(cart.id)
  applyCart(cart)
  return cart.id
}

export async function refreshCart() {
  if (!cartStore.id) {
    cartStore.ready = true
    return
  }
  try {
    const cart = await api.getCart(cartStore.id)
    applyCart(cart)
  } catch {
    cartStore.id = null
    localStorage.removeItem(CART_KEY)
    cartStore.items = []
    cartStore.itemCount = 0
    cartStore.total = 0
    cartStore.ready = true
  }
}

export async function addToCart(dto) {
  const id = await ensureCart()
  const cart = await api.addCartItem(id, dto)
  applyCart(cart)
}

export async function updateCartItem(itemId, quantity) {
  const cart = await api.updateCartItem(cartStore.id, itemId, { quantity })
  applyCart(cart)
}

export async function removeCartItem(itemId) {
  const cart = await api.removeCartItem(cartStore.id, itemId)
  applyCart(cart)
}
