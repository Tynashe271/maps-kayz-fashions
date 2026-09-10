<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../lib/api'

const route = useRoute()

const orderNumber = ref(route.params.orderNumber || '')
const email = ref(route.query.email || '')
const loading = ref(false)
const lookupError = ref('')
const order = ref(null)

const reference = ref('')
const note = ref('')
const submittingProof = ref(false)
const proofError = ref('')
const proofSubmitted = ref(false)

const cancelling = ref(false)
const cancelError = ref('')

const isPaid = computed(() => order.value?.paymentStatus === 'PAID')
const isUnderReview = computed(() => ['PROOF_SUBMITTED', 'UNDER_REVIEW'].includes(order.value?.paymentStatus))
const isClosed = computed(() => ['CANCELLED', 'REFUNDED'].includes(order.value?.status?.toUpperCase?.() ?? ''))
const canAct = computed(() => order.value && !isPaid.value && !isClosed.value)

async function lookup() {
  lookupError.value = ''
  order.value = null
  if (!orderNumber.value.trim() || !email.value.trim()) {
    lookupError.value = 'Enter your order number and the email used at checkout.'
    return
  }
  loading.value = true
  try {
    order.value = await api.getOrderByNumber(orderNumber.value.trim(), email.value.trim())
  } catch (err) {
    lookupError.value = err.message
  } finally {
    loading.value = false
  }
}

async function submitProof() {
  proofError.value = ''
  submittingProof.value = true
  try {
    order.value = await api.submitPaymentProof(orderNumber.value.trim(), {
      email: email.value.trim(),
      reference: reference.value || undefined,
      note: note.value || undefined,
    })
    proofSubmitted.value = true
  } catch (err) {
    proofError.value = err.message
  } finally {
    submittingProof.value = false
  }
}

async function cancelOrder() {
  cancelError.value = ''
  cancelling.value = true
  try {
    order.value = await api.cancelOrder(orderNumber.value.trim(), { email: email.value.trim() })
  } catch (err) {
    cancelError.value = err.message
  } finally {
    cancelling.value = false
  }
}

onMounted(() => {
  if (orderNumber.value && email.value) lookup()
})
</script>

<template>
  <div class="page-header">
    <p class="eyebrow dark">Step 6</p>
    <h1>Payment</h1>
    <p>Confirm how you paid and we'll verify it against our merchant account before marking your order paid.</p>
  </div>

  <div class="auth-page" style="padding-top:32px">
    <form v-if="!order" class="form-grid single" @submit.prevent="lookup">
      <div class="field">
        <label for="orderNumber">Order number</label>
        <input id="orderNumber" v-model="orderNumber" type="text" placeholder="MK-1757412345678-0001" required />
      </div>
      <div class="field">
        <label for="payEmail">Email</label>
        <input id="payEmail" v-model="email" type="email" placeholder="you@example.com" required />
      </div>
      <p v-if="lookupError" class="alert alert-error">{{ lookupError }}</p>
      <div class="form-actions">
        <button class="btn btn-primary" type="submit" :disabled="loading">{{ loading ? 'Looking up…' : 'Find my order' }}</button>
      </div>
    </form>

    <template v-else>
      <div class="checkout-summary-line" style="padding:0 0 4px"><span>Order</span><strong>{{ order.orderNumber }}</strong></div>
      <div class="checkout-summary-line" style="padding:0 0 20px"><span>Payment method</span><strong>{{ order.paymentMethod }}</strong></div>

      <div class="checkout-summary">
        <div v-for="item in order.items" :key="item.id" class="checkout-summary-line">
          <span>Item &times;{{ item.quantity }}</span>
          <strong>US${{ Number(item.total).toFixed(2) }}</strong>
        </div>
        <div class="checkout-summary-line"><span>Delivery</span><strong>US${{ Number(order.deliveryFee).toFixed(2) }}</strong></div>
        <div class="checkout-summary-line" style="border-top:1px solid var(--line);padding-top:12px;margin-top:6px">
          <span>Total</span><strong>US${{ Number(order.total).toFixed(2) }}</strong>
        </div>
      </div>

      <div v-if="isPaid" class="order-status-callout">
        <strong>Payment received</strong>
        <p style="color:var(--muted);font-size:13px;margin:0">Thank you — your order is now being processed.</p>
      </div>

      <div v-else-if="isClosed" class="order-status-callout">
        <strong>{{ order.status }}</strong>
        <p style="color:var(--muted);font-size:13px;margin:0">This order is no longer open for payment. Contact us if that doesn't look right.</p>
      </div>

      <template v-else>
        <p v-if="isUnderReview" class="alert alert-info">
          We've received your payment proof and are checking it against our merchant account. We'll confirm on WhatsApp once it's verified.
        </p>
        <p v-else class="alert alert-info">
          Pay US${{ Number(order.total).toFixed(2) }} via <strong>{{ order.paymentMethod }}</strong>, using order number <strong>{{ order.orderNumber }}</strong> as your reference, then submit your proof of payment below.
        </p>

        <form v-if="canAct" class="form-grid single" @submit.prevent="submitProof">
          <div class="field">
            <label for="reference">Transaction reference (optional)</label>
            <input id="reference" v-model="reference" type="text" placeholder="ZB240915001" />
          </div>
          <div class="field">
            <label for="note">Note (optional)</label>
            <textarea id="note" v-model="note" rows="2" placeholder="Paid via EcoCash at 14:32"></textarea>
          </div>
          <p v-if="proofError" class="alert alert-error">{{ proofError }}</p>
          <p v-if="proofSubmitted" class="alert alert-success">Proof submitted — we'll confirm your payment shortly.</p>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit" :disabled="submittingProof">{{ submittingProof ? 'Submitting…' : "I've paid — submit proof" }}</button>
          </div>
        </form>

        <p v-if="cancelError" class="alert alert-error">{{ cancelError }}</p>
        <div v-if="canAct" class="form-actions">
          <button class="btn btn-ghost" type="button" :disabled="cancelling" @click="cancelOrder">{{ cancelling ? 'Cancelling…' : 'Cancel this order' }}</button>
        </div>
      </template>

      <div class="form-actions">
        <router-link class="text-link" :to="{ path: '/track-order', query: { orderNumber: order.orderNumber, email } }">Track this order</router-link>
      </div>
    </template>
  </div>
</template>
