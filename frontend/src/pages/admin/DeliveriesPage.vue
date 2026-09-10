<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../../lib/api'
import { DELIVERY_STATUSES, humanize } from '../../lib/enums'

const loading = ref(true)
const error = ref('')
const deliveries = ref([])
const orders = ref([])
const orderNumbers = ref({})

const createForm = ref({ orderId: '', method: 'delivery', address: '' })
const creating = ref(false)
const createError = ref('')

const editingId = ref(null)
const editForm = ref({ status: '', trackingNumber: '', courierName: '' })
const saving = ref(false)
const editError = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    deliveries.value = await api.listDeliveries()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  api.listOrders().then((list) => {
    orders.value = list
    orderNumbers.value = Object.fromEntries(list.map((o) => [o.id, o.orderNumber]))
  }).catch(() => {
    // Orders power the create-delivery picker too, but a failure here shouldn't block the deliveries list above.
  })
})

async function submitCreate() {
  createError.value = ''
  if (!createForm.value.orderId) { createError.value = 'Choose an order.'; return }
  creating.value = true
  try {
    await api.createDelivery({ orderId: createForm.value.orderId, method: createForm.value.method || undefined, address: createForm.value.address || undefined })
    createForm.value = { orderId: '', method: 'delivery', address: '' }
    await load()
  } catch (err) {
    createError.value = err.message
  } finally {
    creating.value = false
  }
}

function openEdit(delivery) {
  editingId.value = delivery.id
  editForm.value = { status: delivery.status, trackingNumber: delivery.trackingNumber ?? '', courierName: delivery.courierName ?? '' }
  editError.value = ''
}

async function submitEdit(delivery) {
  editError.value = ''
  saving.value = true
  try {
    await api.updateDelivery(delivery.id, {
      status: editForm.value.status,
      trackingNumber: editForm.value.trackingNumber || undefined,
      courierName: editForm.value.courierName || undefined,
    })
    editingId.value = null
    await load()
  } catch (err) {
    editError.value = err.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="admin-page-header">
    <div><h1>Deliveries</h1><p>/api/operations/deliveries &mdash; fulfilment tracking, one delivery per order.</p></div>
  </div>

  <div class="admin-panel">
    <h2>Create delivery</h2>
    <p v-if="createError" class="alert alert-error">{{ createError }}</p>
    <form class="inline-edit-form" @submit.prevent="submitCreate">
      <div class="field">
        <label>Order</label>
        <select v-model="createForm.orderId" required>
          <option value="" disabled>Choose…</option>
          <option v-for="o in orders" :key="o.id" :value="o.id">{{ o.orderNumber }} &mdash; {{ o.status }}</option>
        </select>
      </div>
      <div class="field"><label>Method</label><input v-model="createForm.method" /></div>
      <div class="field"><label>Address (optional)</label><input v-model="createForm.address" /></div>
      <button class="btn btn-primary" type="submit" :disabled="creating">{{ creating ? 'Creating…' : 'Create' }}</button>
    </form>
  </div>

  <p v-if="error" class="alert alert-error">{{ error }}</p>
  <div v-if="loading" class="loading-state">Loading&hellip;</div>
  <div v-else-if="!deliveries.length" class="empty-state"><h3>No deliveries yet</h3></div>
  <div v-else class="table-wrap">
    <table class="data-table">
      <thead><tr><th>Order</th><th>Method</th><th>Status</th><th>Tracking #</th><th>Courier</th><th></th></tr></thead>
      <tbody>
        <tr v-for="d in deliveries" :key="d.id">
          <td>{{ orderNumbers[d.orderId] ?? d.orderId }}</td>
          <td>{{ d.method }}</td>
          <template v-if="editingId === d.id">
            <td><select v-model="editForm.status"><option v-for="s in DELIVERY_STATUSES" :key="s" :value="s">{{ humanize(s) }}</option></select></td>
            <td><input v-model="editForm.trackingNumber" placeholder="Tracking #" /></td>
            <td><input v-model="editForm.courierName" placeholder="Courier" /></td>
            <td>
              <div class="row-actions">
                <button class="btn btn-primary btn-sm" type="button" :disabled="saving" @click="submitEdit(d)">Save</button>
                <button class="btn btn-ghost btn-sm" type="button" @click="editingId = null">Cancel</button>
              </div>
              <p v-if="editError" class="stock-note out">{{ editError }}</p>
            </td>
          </template>
          <template v-else>
            <td><span class="status-pill" :class="d.status === 'delivered' || d.status === 'collected' ? 'tone-success' : d.status === 'failed' ? 'tone-danger' : 'tone-muted'">{{ humanize(d.status) }}</span></td>
            <td>{{ d.trackingNumber ?? '—' }}</td>
            <td>{{ d.courierName ?? '—' }}</td>
            <td><button class="btn btn-ghost btn-sm" type="button" @click="openEdit(d)">Update</button></td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>
