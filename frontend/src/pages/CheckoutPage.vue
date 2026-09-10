<script setup>
import { ref, reactive, onMounted } from 'vue'
import { cartStore, refreshCart } from '../lib/cart'
import { authStore } from '../lib/auth'
import { api } from '../lib/api'

const loading = ref(true)
const error = ref('')
const submitting = ref(false)
const result = ref(null)
const placedItems = ref([])
const copied = ref(false)

const form = reactive({
  name: '',
  phone: '',
  email: authStore.user?.email || '',
  fulfilmentMethod: 'delivery',
  address: '',
  city: '',
  suburb: '',
  landmark: '',
  instructions: '',
  paymentMethod: 'EcoCash',
  orderNotes: '',
})

const PAYMENT_METHODS = ['EcoCash', 'Paynow', 'Bank transfer / ZIPIT', 'Cash on collection']

onMounted(async () => {
  try {
    await refreshCart()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

function clearCart() {
  cartStore.id = null
  cartStore.items = []
  cartStore.itemCount = 0
  cartStore.total = 0
  localStorage.removeItem('mk_cart_id')
}

// Placing the order — the checkout form's single job. The backend validates
// stock and prices server-side, saves the order, reserves stock and hands
// back the prepared WhatsApp message + payment link in one response; nothing
// here ever depends on WhatsApp to create the order record itself.
async function submit() {
  submitting.value = true
  error.value = ''
  try {
    const isDelivery = form.fulfilmentMethod === 'delivery'
    const order = await api.createOrder({
      customer: { name: form.name, phone: form.phone, email: form.email },
      items: cartStore.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size || undefined,
        colour: item.colour || undefined,
      })),
      fulfilmentMethod: form.fulfilmentMethod,
      deliveryAddress: isDelivery
        ? { address: form.address, city: form.city, suburb: form.suburb, landmark: form.landmark, instructions: form.instructions }
        : undefined,
      paymentMethod: form.paymentMethod,
      orderNotes: form.orderNotes || undefined,
    })
    result.value = order
    placedItems.value = [...cartStore.items]
    clearCart()
  } catch (err) {
    error.value = err.message
  } finally {
    submitting.value = false
  }
}

async function copyMessage() {
  try {
    await navigator.clipboard.writeText(result.value.whatsapp.message)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Clipboard access can be blocked by the browser — the text is already visible to copy manually.
  }
}
</script>

<template>
  <div class="page-header">
    <p class="eyebrow dark">Almost there</p>
    <h1>Checkout</h1>
    <p>We save your order first, then hand you straight to WhatsApp so our team can confirm sizing, payment and delivery with you directly.</p>
  </div>

  <div class="checkout-page">
    <div v-if="loading" class="loading-state">Loading your cart&hellip;</div>
    <div v-else-if="!result && !cartStore.items.length" class="empty-state">
      <h3>Your cart is empty</h3>
      <p><router-link to="/shop" class="text-link">Continue shopping <span>&rarr;</span></router-link></p>
    </div>
    <template v-else-if="!result">
      <div class="checkout-summary">
        <div v-for="item in cartStore.items" :key="item.id" class="checkout-summary-line">
          <span>{{ item.name }} &times;{{ item.quantity }}</span>
          <strong>US${{ (item.unitPrice * item.quantity).toFixed(2) }}</strong>
        </div>
        <div class="checkout-summary-line" style="border-top:1px solid var(--line);padding-top:12px;margin-top:6px">
          <span>Total</span><strong>US${{ Number(cartStore.total).toFixed(2) }}</strong>
        </div>
        <p class="field-help" style="margin-top:6px">Delivery outside Bulawayo and any discounts are calculated by the server on the next step.</p>
      </div>

      <p v-if="error" class="alert alert-error">{{ error }}</p>

      <form class="form-grid" @submit.prevent="submit">
        <div class="field">
          <label for="name">Full name</label>
          <input id="name" v-model="form.name" type="text" placeholder="Jane Moyo" required />
        </div>
        <div class="field">
          <label for="phone">Phone / WhatsApp number</label>
          <input id="phone" v-model="form.phone" type="tel" placeholder="+263771234567" required />
        </div>
        <div class="field span-2">
          <label for="email">Email address</label>
          <input id="email" v-model="form.email" type="email" placeholder="you@example.com" required />
        </div>

        <div class="field span-2">
          <label>Delivery or collection</label>
          <div class="form-grid" style="grid-template-columns:1fr 1fr">
            <label class="field-checkbox"><input type="radio" value="delivery" v-model="form.fulfilmentMethod" /> Delivery</label>
            <label class="field-checkbox"><input type="radio" value="collection" v-model="form.fulfilmentMethod" /> Collection</label>
          </div>
        </div>

        <template v-if="form.fulfilmentMethod === 'delivery'">
          <div class="field span-2">
            <label for="address">Delivery address</label>
            <input id="address" v-model="form.address" type="text" placeholder="Street address" required />
          </div>
          <div class="field">
            <label for="city">City</label>
            <input id="city" v-model="form.city" type="text" placeholder="Bulawayo" required />
          </div>
          <div class="field">
            <label for="suburb">Suburb</label>
            <input id="suburb" v-model="form.suburb" type="text" placeholder="Cowdray Park" required />
          </div>
          <div class="field span-2">
            <label for="landmark">Nearby landmark</label>
            <input id="landmark" v-model="form.landmark" type="text" placeholder="Near the shopping centre" />
          </div>
          <div class="field span-2">
            <label for="instructions">Delivery instructions</label>
            <textarea id="instructions" v-model="form.instructions" rows="2"></textarea>
          </div>
        </template>

        <div class="field span-2">
          <label for="paymentMethod">Payment method</label>
          <select id="paymentMethod" v-model="form.paymentMethod">
            <option v-for="method in PAYMENT_METHODS" :key="method" :value="method">{{ method }}</option>
          </select>
        </div>
        <div class="field span-2">
          <label for="orderNotes">Order notes</label>
          <textarea id="orderNotes" v-model="form.orderNotes" rows="2" placeholder="Anything else we should know?"></textarea>
        </div>

        <div class="form-actions span-2">
          <button class="btn btn-primary" type="submit" :disabled="submitting">{{ submitting ? 'Placing order…' : 'Place Order and Continue on WhatsApp' }}</button>
        </div>
      </form>
    </template>

    <div v-else>
      <p class="alert alert-success">Order {{ result.orderNumber }} is saved — it's already in our system. Send the WhatsApp message below to confirm it with our team.</p>

      <div class="checkout-summary">
        <div v-for="item in placedItems" :key="item.id" class="checkout-summary-line">
          <span>{{ item.name }} &times;{{ item.quantity }}</span>
          <strong>US${{ (item.unitPrice * item.quantity).toFixed(2) }}</strong>
        </div>
        <div class="checkout-summary-line"><span>Delivery</span><strong>US${{ Number(result.deliveryFee).toFixed(2) }}</strong></div>
        <div class="checkout-summary-line" style="border-top:1px solid var(--line);padding-top:12px;margin-top:6px">
          <span>Total</span><strong>US${{ Number(result.total).toFixed(2) }}</strong>
        </div>
      </div>

      <div class="field">
        <label>Order message</label>
        <textarea readonly rows="8" :value="result.whatsapp.message"></textarea>
      </div>
      <div class="form-actions">
        <a class="whatsapp-cta" :href="result.whatsapp.url" target="_blank" rel="noopener">Open WhatsApp &rarr;</a>
        <button class="btn btn-ghost" type="button" @click="copyMessage">{{ copied ? 'Copied' : 'Copy message' }}</button>
      </div>
      <div class="form-actions">
        <router-link class="btn btn-ghost" :to="{ path: `/pay/${result.orderNumber}`, query: { email: form.email } }">Continue to payment &rarr;</router-link>
        <router-link class="text-link" :to="{ path: '/track-order', query: { orderNumber: result.orderNumber, email: form.email } }">Track this order</router-link>
      </div>
    </div>
  </div>
</template>
