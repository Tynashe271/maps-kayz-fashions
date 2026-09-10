<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../../lib/api'

const loading = ref(true)
const error = ref('')
const customers = ref([])
const showForm = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')

function emptyForm() { return { name: '', email: '', phone: '', city: '' } }
const form = ref(emptyForm())

async function load() {
  loading.value = true
  error.value = ''
  try {
    customers.value = await api.listCustomers()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
onMounted(load)

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  formError.value = ''
  showForm.value = true
}

function openEdit(customer) {
  editingId.value = customer.id
  form.value = { name: customer.name, email: customer.email, phone: customer.phone ?? '', city: customer.city ?? '' }
  formError.value = ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = null
}

async function submitForm() {
  formError.value = ''
  const dto = { name: form.value.name, email: form.value.email, phone: form.value.phone }
  saving.value = true
  try {
    if (editingId.value) await api.updateCustomer(editingId.value, dto)
    else await api.createCustomer(dto)
    closeForm()
    await load()
  } catch (err) {
    formError.value = err.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="admin-page-header">
    <div><h1>Customers</h1><p>/api/customers &mdash; staff-managed customer records (separate from shopper login accounts).</p></div>
    <button class="btn btn-primary btn-sm" type="button" @click="openCreate">New customer</button>
  </div>

  <p v-if="error" class="alert alert-error">{{ error }}</p>

  <div class="admin-panel" v-if="showForm">
    <h2>{{ editingId ? 'Edit customer' : 'New customer' }}</h2>
    <p v-if="formError" class="alert alert-error">{{ formError }}</p>
    <form class="form-grid" @submit.prevent="submitForm">
      <div class="field"><label>Name</label><input v-model="form.name" required /></div>
      <div class="field"><label>Email</label><input v-model="form.email" type="email" required /></div>
      <div class="field"><label>Phone</label><input v-model="form.phone" required /></div>
      <div class="form-actions span-2">
        <button class="btn btn-primary" type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save customer' }}</button>
        <button class="btn btn-ghost" type="button" @click="closeForm">Cancel</button>
      </div>
    </form>
  </div>

  <div v-if="loading" class="loading-state">Loading&hellip;</div>
  <div v-else-if="!customers.length" class="empty-state"><h3>No customers</h3></div>
  <div v-else class="table-wrap">
    <table class="data-table">
      <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Loyalty points</th><th></th></tr></thead>
      <tbody>
        <tr v-for="c in customers" :key="c.id">
          <td>{{ c.name }}</td>
          <td>{{ c.email }}</td>
          <td>{{ c.phone ?? '—' }}</td>
          <td>{{ c.loyaltyPoints }}</td>
          <td><button class="btn btn-ghost btn-sm" type="button" @click="openEdit(c)">Edit</button></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
