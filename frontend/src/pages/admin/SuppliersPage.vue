<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../../lib/api'

const loading = ref(true)
const error = ref('')
const suppliers = ref([])
const products = ref([])
const mappings = ref([])
const showForm = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')

function emptyForm() { return { name: '', contactName: '', phone: '', email: '', address: '', notes: '', active: true } }
const form = ref(emptyForm())

function productsFor(supplierId) {
  const productIds = new Set(mappings.value.filter((m) => m.data?.supplierId === supplierId).map((m) => m.data?.productId))
  return products.value.filter((p) => productIds.has(p.id))
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [supplierRows, productRows, mappingRows] = await Promise.all([api.listSuppliers(), api.listProducts(), api.listSupplierProductMappings()])
    suppliers.value = supplierRows
    products.value = productRows
    mappings.value = mappingRows
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

function openEdit(supplier) {
  editingId.value = supplier.id
  form.value = { ...emptyForm(), ...supplier.data }
  formError.value = ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = null
}

async function submitForm() {
  formError.value = ''
  const dto = { ...form.value }
  saving.value = true
  try {
    if (editingId.value) await api.updateSupplier(editingId.value, dto)
    else await api.createSupplier(dto)
    closeForm()
    await load()
  } catch (err) {
    formError.value = err.message
  } finally {
    saving.value = false
  }
}

async function toggleActive(supplier) {
  error.value = ''
  try {
    await api.updateSupplier(supplier.id, { ...supplier.data, active: !supplier.data.active })
    await load()
  } catch (err) {
    error.value = err.message
  }
}

async function remove(supplier) {
  error.value = ''
  try {
    await api.deleteSupplier(supplier.id)
    await load()
  } catch (err) {
    error.value = err.message
  }
}

async function assignProduct(supplierId, productId) {
  if (!productId) return
  error.value = ''
  try {
    await api.setProductSupplier(productId, supplierId)
    await load()
  } catch (err) {
    error.value = err.message
  }
}
</script>

<template>
  <div class="admin-page-header">
    <div><h1>Suppliers</h1><p>/api/platform/suppliers &mdash; supplier records and the products each one supplies.</p></div>
    <button class="btn btn-primary btn-sm" type="button" @click="openCreate">New supplier</button>
  </div>

  <p v-if="error" class="alert alert-error">{{ error }}</p>

  <div class="admin-panel" v-if="showForm">
    <h2>{{ editingId ? 'Edit supplier' : 'New supplier' }}</h2>
    <p v-if="formError" class="alert alert-error">{{ formError }}</p>
    <form class="form-grid" @submit.prevent="submitForm">
      <div class="field"><label>Name</label><input v-model="form.name" required /></div>
      <div class="field"><label>Contact person</label><input v-model="form.contactName" /></div>
      <div class="field"><label>Phone</label><input v-model="form.phone" placeholder="263771234567" /></div>
      <div class="field"><label>Email</label><input v-model="form.email" type="email" /></div>
      <div class="field span-2"><label>Address</label><input v-model="form.address" /></div>
      <div class="field span-2"><label>Notes</label><textarea v-model="form.notes"></textarea></div>
      <div class="field field-checkbox"><input id="active" v-model="form.active" type="checkbox" /><label for="active" style="text-transform:none">Active</label></div>
      <div class="form-actions span-2">
        <button class="btn btn-primary" type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save supplier' }}</button>
        <button class="btn btn-ghost" type="button" @click="closeForm">Cancel</button>
      </div>
    </form>
  </div>

  <div v-if="loading" class="loading-state">Loading&hellip;</div>
  <div v-else-if="!suppliers.length" class="empty-state"><h3>No suppliers yet</h3><p>Add one to start linking products to who supplies them.</p></div>
  <div v-else class="table-wrap">
    <table class="data-table">
      <thead><tr><th>Name</th><th>Contact</th><th>Products supplied</th><th>Status</th><th></th></tr></thead>
      <tbody>
        <tr v-for="s in suppliers" :key="s.id">
          <td><strong>{{ s.data.name }}</strong><div v-if="s.data.address" style="color:var(--text-muted,#888);font-size:.85em">{{ s.data.address }}</div></td>
          <td>{{ s.data.contactName || '—' }}<div v-if="s.data.phone || s.data.email" style="color:var(--text-muted,#888);font-size:.85em">{{ [s.data.phone, s.data.email].filter(Boolean).join(' · ') }}</div></td>
          <td>
            <div v-if="!productsFor(s.id).length" style="color:var(--text-muted,#888)">None assigned</div>
            <ul v-else style="margin:0;padding-left:1.1em">
              <li v-for="p in productsFor(s.id)" :key="p.id">{{ p.name }} <small>({{ p.sku }})</small></li>
            </ul>
            <select :value="''" style="margin-top:6px" @change="assignProduct(s.id, $event.target.value); $event.target.value=''">
              <option value="" disabled>+ Assign a product…</option>
              <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }} ({{ p.sku }})</option>
            </select>
          </td>
          <td><span class="status-pill" :class="s.data.active ? 'tone-success' : 'tone-muted'">{{ s.data.active ? 'Active' : 'Inactive' }}</span></td>
          <td>
            <div class="row-actions">
              <button class="btn btn-ghost btn-sm" type="button" @click="openEdit(s)">Edit</button>
              <button class="btn btn-ghost btn-sm" type="button" @click="toggleActive(s)">{{ s.data.active ? 'Deactivate' : 'Activate' }}</button>
              <button class="btn btn-danger btn-sm" type="button" @click="remove(s)">Delete</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
