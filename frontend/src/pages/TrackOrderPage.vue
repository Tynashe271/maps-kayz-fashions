<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../lib/api'
import { MAIN_ORDER_STEPS, mainStepIndex } from '../lib/enums'

const route = useRoute()

const orderNumber = ref(route.query.orderNumber ?? '')
const email = ref(route.query.email ?? '')
const tracking = ref(false)
const trackError = ref('')
const order = ref(null)
const returnRequest = ref(null)
const productNames = ref({})

const currentStepIndex = computed(() => (order.value ? mainStepIndex(order.value.status) : -1))
const isExceptionStatus = computed(() => !!order.value && currentStepIndex.value === -1)

const EXCEPTION_COPY = {
  Cancelled: 'This order was cancelled.',
  'On hold': 'This order is on hold — our team will be in touch.',
  'Payment failed': 'Payment for this order failed. Please try checking out again or contact us.',
  'Partially fulfilled': 'Part of this order has shipped; the rest is still being prepared.',
  'Return requested': 'A return has been requested for this order.',
  Returned: 'This order has been returned.',
  'Exchange processing': 'Your exchange is being processed.',
  Refunded: 'This order has been refunded.',
}

async function trackOrder() {
  trackError.value = ''
  order.value = null
  returnRequest.value = null
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

onMounted(() => {
  if (orderNumber.value && email.value) trackOrder()
})
</script>

<template>
  <div class="page-header">
    <p class="eyebrow dark">Where's my order?</p>
    <h1>Track order</h1>
    <p>Enter your order number and the email you used at checkout to see its current status.</p>
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
      <div class="checkout-summary-line" style="padding:0 0 4px"><span>Order</span><strong>{{ order.orderNumber }}</strong></div>
      <div class="checkout-summary-line" style="padding:0 0 20px"><span>Placed</span><strong>{{ new Date(order.createdAt).toLocaleDateString() }}</strong></div>

      <div v-if="isExceptionStatus" class="order-status-callout">
        <strong>{{ order.status }}</strong>
        <p style="color:var(--muted);font-size:13px;margin:0">{{ EXCEPTION_COPY[order.status] ?? "We'll update you as this progresses." }}</p>
      </div>
      <div v-else class="order-timeline">
        <div
          v-for="(step, index) in MAIN_ORDER_STEPS"
          :key="step.label"
          class="order-timeline-step"
          :class="{ done: index <= currentStepIndex, current: index === currentStepIndex }"
        >
          <div class="order-timeline-dot">{{ index < currentStepIndex ? '✓' : '' }}</div>
          <span>{{ step.label }}</span>
        </div>
      </div>

      <div class="checkout-summary" style="margin-top:24px">
        <div v-for="item in order.items" :key="item.id" class="checkout-summary-line">
          <span>{{ productNames[item.productId] ?? item.productId }} &times;{{ item.quantity }}</span>
          <strong>US${{ Number(item.total).toFixed(2) }}</strong>
        </div>
        <div class="checkout-summary-line" style="border-top:1px solid var(--line);padding-top:12px;margin-top:6px">
          <span>Total</span><strong>US${{ Number(order.total).toFixed(2) }}</strong>
        </div>
      </div>

      <p v-if="returnRequest" class="alert alert-info" style="margin-top:20px">
        A return request is on file for this order &mdash; status: <strong>{{ returnRequest.status }}</strong>.
      </p>
      <div class="form-actions" style="margin-top:20px">
        <router-link
          class="btn btn-ghost"
          :to="{ path: '/returns', query: { orderNumber: order.orderNumber, email } }"
        >{{ returnRequest ? 'View return request' : 'Request a return' }}</router-link>
      </div>
    </div>
  </div>
</template>
