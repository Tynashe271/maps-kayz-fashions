<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../lib/api'
import { humanize } from '../lib/enums'

const route = useRoute()

const orderNumber = ref(route.query.orderNumber ?? '')
const email = ref(route.query.email ?? '')
const tracking = ref(false)
const trackError = ref('')
const order = ref(null)
const returnRequest = ref(null)
const productNames = ref({})

const reason = ref('')
const notes = ref('')
const submitting = ref(false)
const submitError = ref('')
const submitted = ref(false)

async function trackOrder() {
  trackError.value = ''
  order.value = null
  returnRequest.value = null
  submitted.value = false
  if (!orderNumber.value.trim() || !email.value.trim()) {
    trackError.value = 'Enter your order number and the email used at checkout.'
    return
  }
  tracking.value = true
  // Product names don't depend on the lookup result, so fetch them at the same time
  // instead of waiting for the order to come back first.
  const productNamesPromise = api.listProducts().then((products) => Object.fromEntries(products.map((p) => [p.id, p.name]))).catch(() => null)
  try {
    const result = await api.trackOrder(orderNumber.value.trim(), email.value.trim())
    order.value = result.order
    returnRequest.value = result.returnRequest
    const names = await productNamesPromise
    if (names) productNames.value = names
  } catch (err) {
    trackError.value = err.message
  } finally {
    tracking.value = false
  }
}

async function submitReturn() {
  submitError.value = ''
  if (!reason.value.trim()) {
    submitError.value = 'Tell us the reason for your return.'
    return
  }
  submitting.value = true
  try {
    returnRequest.value = await api.requestOrderReturn(order.value.id, {
      email: email.value.trim(),
      reason: reason.value.trim(),
      notes: notes.value.trim() || undefined,
    })
    submitted.value = true
  } catch (err) {
    submitError.value = err.message
  } finally {
    submitting.value = false
  }
}

function statusTone(status) {
  if (['refunded', 'exchanged'].includes(status)) return 'tone-success'
  if (status === 'rejected') return 'tone-danger'
  return 'tone-pink'
}

onMounted(() => {
  if (orderNumber.value && email.value) trackOrder()
})
</script>

<template>
  <div class="page-header">
    <p class="eyebrow dark">Track an order</p>
    <h1>Returns &amp; exchanges</h1>
    <p>Enter your order number and the email you used at checkout to track your order and, if eligible, request a return or exchange.</p>
  </div>

  <div class="auth-page" style="padding-top:32px">
    <form class="form-grid single" @submit.prevent="trackOrder">
      <div class="field">
        <label for="orderNumber">Order number</label>
        <input id="orderNumber" v-model="orderNumber" type="text" placeholder="MK-1757412345678-0001" required />
      </div>
      <div class="field">
        <label for="trackEmail">Email</label>
        <input id="trackEmail" v-model="email" type="email" placeholder="you@example.com" required />
      </div>
      <p v-if="trackError" class="alert alert-error">{{ trackError }}</p>
      <div class="form-actions">
        <button class="btn btn-primary" type="submit" :disabled="tracking">{{ tracking ? 'Looking up…' : 'Track order' }}</button>
      </div>
    </form>

    <div v-if="order" style="margin-top:36px">
      <div class="checkout-summary">
        <div class="checkout-summary-line"><span>Order</span><strong>{{ order.orderNumber }}</strong></div>
        <div class="checkout-summary-line"><span>Status</span><strong>{{ order.status }}</strong></div>
        <div class="checkout-summary-line"><span>Placed</span><strong>{{ new Date(order.createdAt).toLocaleDateString() }}</strong></div>
        <div class="checkout-summary-line" v-for="item in order.items" :key="item.id">
          <span>{{ productNames[item.productId] ?? item.productId }} &times;{{ item.quantity }}</span>
          <strong>US${{ Number(item.total).toFixed(2) }}</strong>
        </div>
        <div class="checkout-summary-line" style="border-top:1px solid var(--line);padding-top:12px;margin-top:6px">
          <span>Total</span><strong>US${{ Number(order.total).toFixed(2) }}</strong>
        </div>
      </div>

      <div v-if="returnRequest" class="account-card" style="margin-top:20px">
        <span class="status-pill" :class="statusTone(returnRequest.status)">{{ humanize(returnRequest.status) }}</span>
        <h3 style="margin-top:14px">Return already requested</h3>
        <p style="color:var(--muted);font-size:13px;margin:0 0 4px">Reason: {{ returnRequest.reason }}</p>
        <p v-if="returnRequest.notes" style="color:var(--muted);font-size:13px;margin:0">{{ returnRequest.notes }}</p>
        <p style="color:var(--muted);font-size:13px;margin:14px 0 0">We'll message you on WhatsApp once it's reviewed. No need to submit another request.</p>
      </div>

      <div v-else style="margin-top:28px">
        <p v-if="order.status !== 'Delivered'" class="alert alert-info">
          This order is currently <strong>{{ order.status }}</strong>. Returns are usually handled once an order has been delivered, but you're welcome to log a request now and our team will follow up.
        </p>

        <template v-if="!submitted">
          <h3 style="font:400 22px 'Libre Baskerville';margin:0 0 16px">Request a return or exchange</h3>
          <p v-if="submitError" class="alert alert-error">{{ submitError }}</p>
          <form class="form-grid single" @submit.prevent="submitReturn">
            <div class="field"><label for="reason">Reason</label><input id="reason" v-model="reason" type="text" placeholder="Wrong size" required /></div>
            <div class="field"><label for="notes">Notes (optional)</label><textarea id="notes" v-model="notes" rows="3" placeholder="Anything else we should know?"></textarea></div>
            <div class="form-actions">
              <button class="btn btn-primary" type="submit" :disabled="submitting">{{ submitting ? 'Submitting…' : 'Submit request' }}</button>
            </div>
          </form>
        </template>
        <p v-else class="alert alert-success">Your return request has been logged. We'll be in touch on WhatsApp to confirm next steps.</p>
      </div>
    </div>
  </div>
</template>
