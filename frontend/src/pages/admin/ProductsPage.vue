<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { api } from '../../lib/api'

const loading = ref(true)
const error = ref('')
const products = ref([])
const categories = ref([])

const search = ref('')
const categoryFilter = ref('')

const showForm = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')
const confirmingDeleteId = ref(null)

function emptyForm() {
  return { name: '', sku: '', category: '', brand: 'Maps Kayz', price: '', originalPrice: '', stock: '', isFeatured: false, colours: '', sizes: '', description: '' }
}
const form = ref(emptyForm())

async function load() {
  loading.value = true
  error.value = ''
  try {
    products.value = await api.listProducts({ category: categoryFilter.value || undefined, search: search.value || undefined })
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  api.listCategories().then((list) => { categories.value = list }).catch(() => {
    // Non-fatal — the category dropdown just falls back to free text.
  })
  load()
  window.addEventListener('mk-sync', handleSync)
})
onBeforeUnmount(()=>window.removeEventListener('mk-sync',handleSync))
function handleSync(event){if(event.detail?.resource==='products')load()}

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  formError.value = ''
  showForm.value = true
}

function openEdit(product) {
  editingId.value = product.id
  form.value = {
    name: product.name,
    sku: product.sku,
    category: product.category,
    brand: product.brand,
    price: product.price,
    originalPrice: product.originalPrice ?? '',
    stock: product.stock,
    isFeatured: product.isFeatured,
    colours: (product.colours || []).join(', '),
    sizes: (product.sizes || []).join(', '),
    description: product.description,
  }
  formError.value = ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = null
}

function toList(value) {
  return value.split(',').map((v) => v.trim()).filter(Boolean)
}

async function submitForm() {
  formError.value = ''
  const dto = {
    name: form.value.name,
    sku: form.value.sku,
    category: form.value.category,
    brand: form.value.brand,
    price: Number(form.value.price),
    stock: Number(form.value.stock),
    isFeatured: !!form.value.isFeatured,
    colours: toList(form.value.colours),
    sizes: toList(form.value.sizes),
    description: form.value.description,
  }
  if (form.value.originalPrice !== '' && form.value.originalPrice !== null) dto.originalPrice = Number(form.value.originalPrice)
  saving.value = true
  try {
    if (editingId.value) await api.updateProduct(editingId.value, dto)
    else await api.createProduct(dto)
    closeForm()
    await load()
  } catch (err) {
    formError.value = err.message
  } finally {
    saving.value = false
  }
}

async function confirmDelete(product) {
  if (confirmingDeleteId.value !== product.id) {
    confirmingDeleteId.value = product.id
    return
  }
  error.value = ''
  try {
    await api.deleteProduct(product.id)
    confirmingDeleteId.value = null
    await load()
  } catch (err) {
    error.value = err.message
  }
}
</script>

<template>
  <div class="admin-page-header">
    <div><h1>Products</h1><p>/api/products &mdash; catalogue management.</p></div>
    <button class="btn btn-primary btn-sm" type="button" @click="openCreate">New product</button>
  </div>

  <p v-if="error" class="alert alert-error">{{ error }}</p>

  <div class="admin-panel" v-if="showForm">
    <h2>{{ editingId ? 'Edit product' : 'New product' }}</h2>
    <p v-if="formError" class="alert alert-error">{{ formError }}</p>
    <form class="form-grid" @submit.prevent="submitForm">
      <div class="field"><label>Name</label><input v-model="form.name" required /></div>
      <div class="field"><label>SKU</label><input v-model="form.sku" required /></div>
      <div class="field">
        <label>Category</label>
        <input v-model="form.category" list="category-options" placeholder="women-formal" required />
        <datalist id="category-options"><option v-for="c in categories" :key="c.id" :value="c.slug" /></datalist>
      </div>
      <div class="field"><label>Brand</label><input v-model="form.brand" required /></div>
      <div class="field"><label>Price (US$)</label><input v-model="form.price" type="number" min="0" step="0.01" required /></div>
      <div class="field"><label>Original price (optional)</label><input v-model="form.originalPrice" type="number" min="0" step="0.01" /></div>
      <div class="field"><label>Stock</label><input v-model="form.stock" type="number" min="0" step="1" required /></div>
      <div class="field field-checkbox"><input id="featured" v-model="form.isFeatured" type="checkbox" /><label for="featured" style="text-transform:none">Featured product</label></div>
      <div class="field"><label>Colours (comma separated)</label><input v-model="form.colours" placeholder="Black, Gold" required /></div>
      <div class="field"><label>Sizes (comma separated)</label><input v-model="form.sizes" placeholder="S, M, L" required /></div>
      <div class="field span-2"><label>Description</label><textarea v-model="form.description" required></textarea></div>
      <div class="form-actions span-2">
        <button class="btn btn-primary" type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save product' }}</button>
        <button class="btn btn-ghost" type="button" @click="closeForm">Cancel</button>
      </div>
    </form>
  </div>

  <div class="admin-toolbar">
    <select v-model="categoryFilter" @change="load">
      <option value="">All categories</option>
      <option v-for="c in categories" :key="c.id" :value="c.slug">{{ c.name }}</option>
    </select>
    <form @submit.prevent="load"><input v-model="search" type="search" placeholder="Search name, SKU, brand" /></form>
    <button class="btn btn-ghost btn-sm" type="button" @click="load">Refresh</button>
  </div>

  <div v-if="loading" class="loading-state">Loading&hellip;</div>
  <div v-else-if="!products.length" class="empty-state"><h3>No products</h3></div>
  <div v-else class="table-wrap">
    <table class="data-table">
      <thead><tr><th>Name</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
      <tbody>
        <tr v-for="p in products" :key="p.id">
          <td>{{ p.name }}<div v-if="p.isFeatured" class="status-pill tone-pink" style="margin-top:4px">Featured</div></td>
          <td>{{ p.sku }}</td>
          <td>{{ p.category }}</td>
          <td>US${{ Number(p.price).toFixed(2) }}</td>
          <td>{{ p.stock }}</td>
          <td><span class="status-pill" :class="p.isActive ? 'tone-success' : 'tone-muted'">{{ p.isActive ? 'Active' : 'Inactive' }}</span></td>
          <td>
            <div class="row-actions">
              <button class="btn btn-ghost btn-sm" type="button" @click="openEdit(p)">Edit</button>
              <button class="btn btn-danger btn-sm" type="button" @click="confirmDelete(p)">{{ confirmingDeleteId === p.id ? 'Confirm?' : 'Delete' }}</button>
              <button v-if="confirmingDeleteId === p.id" class="btn btn-ghost btn-sm" type="button" @click="confirmingDeleteId = null">Cancel</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
