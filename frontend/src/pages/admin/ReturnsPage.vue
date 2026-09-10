<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../../lib/api'
import { RETURN_STATUSES, humanize } from '../../lib/enums'

const loading = ref(true)
const error = ref('')
const returns = ref([])
const orders = ref([])
const customers = ref([])
const orderNumbers = ref({})
const customerNames = ref({})

const createForm = ref({ orderId: '', customerId: '', reason: '', notes: '' })
const creating = ref(false)
const createError = ref('')

const editingId = ref(null)
const editStatus = ref('')
const saving = ref(false)
const editError = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    returns.value = await api.listReturns()
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
  }).catch(() => { /* display nicety only */ })
  api.listCustomers().then((list) => {
    customers.value = list
    customerNames.value = Object.fromEntries(list.map((c) => [c.id, c.name]))
  }).catch(() => { /* display nicety only */ })
})

function onOrderSelected() {
  const order = orders.value.find((o) => o.id === createForm.value.orderId)
  if (order) createForm.value.customerId = order.customerId
}

async function submitCreate() {
  createError.value = ''
  if (!createForm.value.orderId || !createForm.value.customerId || !createForm.value.reason) {
    createError.value = 'Order, customer and reason are required.'
    return
  }
  creating.value = true
  try {
    await api.createReturn({
      orderId: createForm.value.orderId,
      customerId: createForm.value.customerId,
      reason: createForm.value.reason,
      notes: createForm.value.notes || undefined,
    })
    createForm.value = { orderId: '', customerId: '', reason: '', notes: '' }
    await load()
  } catch (err) {
    createError.value = err.message
  } finally {
    creating.value = false
  }
}

function openEdit(request) {
  editingId.value = request.id
  editStatus.value = request.status
  editError.value = ''
}

async function submitEdit(request) {
  editError.value = ''
  saving.value = true
  try {
    await api.updateReturn(request.id, { status: editStatus.value })
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
    <div><h1>Returns</h1><p>/api/operations/returns &mdash; return and exchange requests.</p></div>
  </div>

  <div class="admin-panel">
    <h2>Log a return request</h2>
    <p v-if="createError" class="alert alert-error">{{ createError }}</p>
    <form class="inline-edit-form" @submit.prevent="submitCreate">
      <div class="field">
        <label>Order</label>
        <select v-model="createForm.orderId" @change="onOrderSelected" required>
          <option value="" disabled>Choose…</option>
          <option v-for="o in orders" :key="o.id" :value="o.id">{{ o.orderNumber }}</option>
        </select>
      </div>
      <div class="field">
        <label>Customer</label>
        <select v-model="createForm.customerId" required>
          <option value="" disabled>Choose…</option>
          <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <div class="field"><label>Reason</label><input v-model="createForm.reason" required /></div>
      <div class="field"><label>Notes (optional)</label><input v-model="createForm.notes" /></div>
      <button class="btn btn-primary" type="submit" :disabled="creating">{{ creating ? 'Logging…' : 'Log return' }}</button>
    </form>
  </div>

  <p v-if="error" class="alert alert-error">{{ error }}</p>
  <div v-if="loading" class="loading-state">Loading&hellip;</div>
  <div v-else-if="!returns.length" class="empty-state"><h3>No return requests</h3></div>
  <div v-else class="table-wrap">
    <table class="data-table">
      <thead><tr><th>Order</th><th>Customer</th><th>Reason</th><th>Status</th><th></th></tr></thead>
      <tbody>
        <tr v-for="r in returns" :key="r.id">
          <td>{{ orderNumbers[r.orderId] ?? r.orderId }}</td>
          <td>{{ customerNames[r.customerId] ?? r.customerId }}</td>
          <td>{{ r.reason }}<div v-if="r.notes" class="field-help">{{ r.notes }}</div></td>
          <template v-if="editingId === r.id">
            <td><select v-model="editStatus"><option v-for="s in RETURN_STATUSES" :key="s" :value="s">{{ humanize(s) }}</option></select></td>
            <td>
              <div class="row-actions">
                <button class="btn btn-primary btn-sm" type="button" :disabled="saving" @click="submitEdit(r)">Save</button>
                <button class="btn btn-ghost btn-sm" type="button" @click="editingId = null">Cancel</button>
              </div>
              <p v-if="editError" class="stock-note out">{{ editError }}</p>
            </td>
          </template>
          <template v-else>
            <td><span class="status-pill" :class="r.status === 'refunded' || r.status === 'exchanged' ? 'tone-success' : r.status === 'rejected' ? 'tone-danger' : 'tone-muted'">{{ humanize(r.status) }}</span></td>
            <td><button class="btn btn-ghost btn-sm" type="button" @click="openEdit(r)">Update</button></td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>
