<script setup>
import { ref, onMounted } from 'vue'
import { cartStore, refreshCart, updateCartItem, removeCartItem } from '../lib/cart'

const loading = ref(true)
const error = ref('')
const lineBusy = ref({})

onMounted(async () => {
  try {
    await refreshCart()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

async function changeQuantity(item, delta) {
  const next = item.quantity + delta
  if (next < 1) return
  lineBusy.value = { ...lineBusy.value, [item.id]: true }
  error.value = ''
  try {
    await updateCartItem(item.id, next)
  } catch (err) {
    error.value = err.message
  } finally {
    lineBusy.value = { ...lineBusy.value, [item.id]: false }
  }
}

async function remove(item) {
  lineBusy.value = { ...lineBusy.value, [item.id]: true }
  error.value = ''
  try {
    await removeCartItem(item.id)
  } catch (err) {
    error.value = err.message
    lineBusy.value = { ...lineBusy.value, [item.id]: false }
  }
}
</script>

<template>
  <div class="page-header">
    <p class="eyebrow dark">Your selection</p>
    <h1>Cart</h1>
  </div>

  <p v-if="error" class="alert alert-error error-state">{{ error }}</p>

  <div v-if="loading" class="loading-state">Loading your cart&hellip;</div>
  <div v-else-if="!cartStore.items.length" class="empty-state">
    <h3>Your cart is empty</h3>
    <p><router-link to="/shop" class="text-link">Continue shopping <span>&rarr;</span></router-link></p>
  </div>
  <div v-else class="cart-page">
    <div>
      <div v-for="item in cartStore.items" :key="item.id" class="cart-line">
        <div class="cart-line-media"><img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" class="product-photo" /><div v-else class="product-swatch" style="height:100%;font-size:11px"><span>{{ item.name }}</span></div></div>
        <div>
          <h4>{{ item.name }}</h4>
          <p class="cart-line-meta">
            {{ item.sku }}
            <span v-if="item.size"> &middot; Size {{ item.size }}</span>
            <span v-if="item.colour"> &middot; {{ item.colour }}</span>
          </p>
          <div class="cart-line-actions">
            <div class="qty-control">
              <button type="button" :disabled="lineBusy[item.id] || item.quantity <= 1" @click="changeQuantity(item, -1)">&minus;</button>
              <span>{{ item.quantity }}</span>
              <button type="button" :disabled="lineBusy[item.id]" @click="changeQuantity(item, 1)">+</button>
            </div>
            <button type="button" class="text-button" :disabled="lineBusy[item.id]" @click="remove(item)">Remove</button>
          </div>
        </div>
        <div class="cart-line-total">US${{ (item.unitPrice * item.quantity).toFixed(2) }}</div>
      </div>
    </div>

    <aside class="cart-summary">
      <div class="cart-summary-row"><span>Items</span><span>{{ cartStore.itemCount }}</span></div>
      <div class="cart-summary-row total"><span>Total</span><span>US${{ Number(cartStore.total).toFixed(2) }}</span></div>
      <router-link to="/checkout" class="btn btn-primary" style="width:100%;margin-top:6px">Checkout via WhatsApp</router-link>
      <router-link to="/shop" class="text-link" style="display:block;margin-top:18px;text-align:center">Continue shopping</router-link>
    </aside>
  </div>
</template>
