<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../../lib/api'
import { ORDER_TRANSITIONS } from '../../lib/enums'

const loading = ref(true)
const error = ref('')
const orders = ref([])
const productNames = ref({})
const customerNames = ref({})
const expanded = ref(null)
const pendingStatus = ref({})
const updating = ref({})
const updateError = ref({})
const verifying = ref({})
const resending = ref({})
const actionNote = ref({})

async function load() {
  loading.value = true
  error.value = ''
  try {
    orders.value = await api.listOrders()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Three independent requests — run them in parallel rather than one after another.
  load()
  api.listProducts().then((products) => {
    productNames.value = Object.fromEntries(products.map((p) => [p.id, p.name]))
  }).catch(() => {
    // Product names are a display nicety — fall back to raw ids if this fails.
  })
  api.listCustomers().then((customers) => {
    customerNames.value = Object.fromEntries(customers.map((c) => [c.id, c.name]))
  }).catch(() => {
    // Same — falls back to raw ids.
  })
})

function toggle(order) {
  expanded.value = expanded.value === order.id ? null : order.id
}

function statusTone(status) {
  if (['Delivered', 'Payment Confirmed'].includes(status)) return 'tone-success'
  if (['Cancelled', 'Payment failed', 'Refunded'].includes(status)) return 'tone-danger'
  if (status.startsWith('Return') || status === 'Exchange processing' || status === 'On hold') return 'tone-pink'
  return 'tone-muted'
}

async function applyStatus(order) {
  const next = pendingStatus.value[order.id]
  if (!next) return
  updating.value = { ...updating.value, [order.id]: true }
  updateError.value = { ...updateError.value, [order.id]: '' }
  try {
    const updated = await api.updateOrder(order.id, { status: next })
    orders.value = orders.value.map((o) => (o.id === order.id ? updated : o))
    pendingStatus.value = { ...pendingStatus.value, [order.id]: '' }
  } catch (err) {
    updateError.value = { ...updateError.value, [order.id]: err.message }
  } finally {
    updating.value = { ...updating.value, [order.id]: false }
  }
}

function paymentTone(status) {
  if (status === 'PAID') return 'tone-success'
  if (['FAILED', 'REJECTED'].includes(status)) return 'tone-danger'
  if (['PROOF_SUBMITTED', 'UNDER_REVIEW', 'PENDING'].includes(status)) return 'tone-pink'
  return 'tone-muted'
}

// Admin "Confirm-payment" action for manual EFT/ZIPIT/EcoCash payments —
// checked against the business account first, then verified here.
async function verifyPayment(order) {
  verifying.value = { ...verifying.value, [order.id]: true }
  updateError.value = { ...updateError.value, [order.id]: '' }
  try {
    const updated = await api.verifyOrderPayment(order.orderNumber, { reference: actionNote.value[order.id] || undefined })
    orders.value = orders.value.map((o) => (o.id === order.id ? updated : o))
  } catch (err) {
    updateError.value = { ...updateError.value, [order.id]: err.message }
  } finally {
    verifying.value = { ...verifying.value, [order.id]: false }
  }
}

// "Resend WhatsApp summary" — regenerates the same order-confirmation link
// the customer got at checkout, for staff to forward manually if needed.
async function resendWhatsApp(order) {
  resending.value = { ...resending.value, [order.id]: true }
  updateError.value = { ...updateError.value, [order.id]: '' }
  try {
    const { url } = await api.resendWhatsAppLink(order.orderNumber)
    window.open(url, '_blank', 'noopener')
  } catch (err) {
    updateError.value = { ...updateError.value, [order.id]: err.message }
  } finally {
    resending.value = { ...resending.value, [order.id]: false }
  }
}
</script>

<template>
  <div class="admin-page-header">
    <div><h1>Orders</h1><p>/api/orders &mdash; status changes are validated against the backend's allowed workflow transitions. Confirm payment and resend WhatsApp via /api/admin/orders.</p></div>
    <button class="btn btn-ghost btn-sm" type="button" @click="load">Refresh</button>
  </div>

  <p v-if="error" class="alert alert-error">{{ error }}</p>
  <div v-if="loading" class="loading-state">Loading&hellip;</div>
  <div v-else-if="!orders.length" class="empty-state"><h3>No orders yet</h3></div>
  <div v-else class="table-wrap">
    <table class="data-table">
      <thead><tr><th>Order #</th><th>Customer</th><th>Status</th><th>Total</th><th>Payment</th><th>WhatsApp</th><th>Placed</th><th>Actions</th></tr></thead>
      <tbody>
        <template v-for="order in orders" :key="order.id">
          <tr>
            <td><button type="button" class="text-button" @click="toggle(order)">{{ order.orderNumber }} {{ expanded === order.id ? '▲' : '▼' }}</button></td>
            <td>{{ customerNames[order.customerId] ?? order.customerId }}</td>
            <td><span class="status-pill" :class="statusTone(order.status)">{{ order.status }}</span></td>
            <td>US${{ Number(order.total).toFixed(2) }}</td>
            <td>
              <span class="status-pill" :class="paymentTone(order.paymentStatus)">{{ order.paymentStatus }}</span>
              <div class="field-help">{{ order.paymentMethod }}</div>
            </td>
            <td><span class="status-pill tone-muted">{{ order.whatsappStatus }}</span></td>
            <td>{{ new Date(order.createdAt).toLocaleDateString() }}</td>
            <td>
              <div v-if="ORDER_TRANSITIONS[order.status]?.length" class="row-actions">
                <select v-model="pendingStatus[order.id]">
                  <option value="">Choose…</option>
                  <option v-for="s in ORDER_TRANSITIONS[order.status]" :key="s" :value="s">{{ s }}</option>
                </select>
                <button class="btn btn-ghost btn-sm" type="button" :disabled="!pendingStatus[order.id] || updating[order.id]" @click="applyStatus(order)">
                  {{ updating[order.id] ? 'Saving…' : 'Update' }}
                </button>
              </div>
              <span v-else class="field-help">No further transitions</span>
              <div class="row-actions" style="margin-top:6px">
                <input
                  v-if="order.paymentStatus !== 'PAID'"
                  v-model="actionNote[order.id]"
                  type="text"
                  placeholder="Txn reference (optional)"
                  style="width:150px"
                />
                <button v-if="order.paymentStatus !== 'PAID'" class="btn btn-ghost btn-sm" type="button" :disabled="verifying[order.id]" @click="verifyPayment(order)">
                  {{ verifying[order.id] ? 'Verifying…' : 'Confirm payment' }}
                </button>
                <button class="btn btn-ghost btn-sm" type="button" :disabled="resending[order.id]" @click="resendWhatsApp(order)">
                  {{ resending[order.id] ? 'Opening…' : 'Resend WhatsApp' }}
                </button>
              </div>
              <p v-if="updateError[order.id]" class="stock-note out">{{ updateError[order.id] }}</p>
            </td>
          </tr>
          <tr v-if="expanded === order.id">
            <td colspan="8" style="background:rgba(255,255,255,.02)">
              <strong style="font-size:12px">Items</strong>
              <table class="data-table" style="min-width:0;margin-top:8px">
                <thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Line total</th></tr></thead>
                <tbody>
                  <tr v-for="item in order.items" :key="item.id">
                    <td>{{ productNames[item.productId] ?? item.productId }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>US${{ Number(item.unitPrice).toFixed(2) }}</td>
                    <td>US${{ Number(item.total).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
