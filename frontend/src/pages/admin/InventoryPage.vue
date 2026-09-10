<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../../lib/api'
import { STOCK_MOVEMENT_TYPES, humanize } from '../../lib/enums'
import { authStore } from '../../lib/auth'

const loading = ref(true)
const error = ref('')
const inventory = ref([])
const products = ref([])
const productNames = ref({})

const movements = ref([])
const movementsFilter = ref('')
const movementsLoading = ref(false)

const adjustForm = ref({ productId: '', branchId: 'head-office', quantity: '', type: 'receipt', reason: '' })
const adjusting = ref(false)
const adjustError = ref('')
const adjustSuccess = ref('')

async function loadInventory() {
  loading.value = true
  error.value = ''
  try {
    inventory.value = await api.listInventory()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function loadMovements() {
  movementsLoading.value = true
  try {
    movements.value = await api.listStockMovements(movementsFilter.value || undefined)
  } catch (err) {
    error.value = err.message
  } finally {
    movementsLoading.value = false
  }
}

onMounted(() => {
  // Three independent requests — run them in parallel rather than one after another.
  loadInventory()
  loadMovements()
  api.listProducts().then((list) => {
    products.value = list
    productNames.value = Object.fromEntries(list.map((p) => [p.id, `${p.name} (${p.sku})`]))
  }).catch(() => {
    // Product names are a display nicety — falls back to raw ids.
  })
})

async function submitAdjust() {
  adjustError.value = ''
  adjustSuccess.value = ''
  if (!adjustForm.value.productId || adjustForm.value.quantity === '') {
    adjustError.value = 'Choose a product and a quantity.'
    return
  }
  adjusting.value = true
  try {
    await api.adjustStock({
      productId: adjustForm.value.productId,
      branchId: adjustForm.value.branchId || 'head-office',
      quantity: Number(adjustForm.value.quantity),
      type: adjustForm.value.type,
      reason: adjustForm.value.reason || undefined,
      staffId: authStore.user?.id,
    })
    adjustSuccess.value = 'Stock adjusted.'
    adjustForm.value.quantity = ''
    adjustForm.value.reason = ''
    await loadInventory()
    await loadMovements()
  } catch (err) {
    adjustError.value = err.message
  } finally {
    adjusting.value = false
  }
}
</script>

<template>
  <div class="admin-page-header">
    <div><h1>Inventory</h1><p>/api/operations/inventory &mdash; per-branch stock levels and movement history.</p></div>
  </div>

  <p class="alert alert-info">
    Inventory here is tracked separately from each product's <code>stock</code> field used by the storefront cart.
    They're seeded to match, but adjustments made here won't change what the storefront shows as available.
  </p>

  <div class="admin-panel">
    <h2>Adjust stock</h2>
    <p v-if="adjustError" class="alert alert-error">{{ adjustError }}</p>
    <p v-if="adjustSuccess" class="alert alert-success">{{ adjustSuccess }}</p>
    <form class="inline-edit-form" @submit.prevent="submitAdjust">
      <div class="field">
        <label>Product</label>
        <select v-model="adjustForm.productId" required>
          <option value="" disabled>Choose…</option>
          <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }} ({{ p.sku }})</option>
        </select>
      </div>
      <div class="field"><label>Branch</label><input v-model="adjustForm.branchId" /></div>
      <div class="field"><label>Quantity (+/&minus;)</label><input v-model="adjustForm.quantity" type="number" step="1" required /></div>
      <div class="field">
        <label>Movement type</label>
        <select v-model="adjustForm.type"><option v-for="t in STOCK_MOVEMENT_TYPES" :key="t" :value="t">{{ humanize(t) }}</option></select>
      </div>
      <div class="field"><label>Reason (optional)</label><input v-model="adjustForm.reason" /></div>
      <button class="btn btn-primary" type="submit" :disabled="adjusting">{{ adjusting ? 'Saving…' : 'Adjust' }}</button>
    </form>
  </div>

  <p v-if="error" class="alert alert-error">{{ error }}</p>
  <div v-if="loading" class="loading-state">Loading&hellip;</div>
  <div v-else class="admin-panel">
    <h2>Stock by branch</h2>
    <div v-if="!inventory.length" class="empty-state" style="padding:20px"><h3>No inventory records</h3></div>
    <div v-else class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Product</th><th>Branch</th><th>Available</th><th>Reserved</th><th>Incoming</th><th>Damaged</th><th>Reorder level</th></tr></thead>
        <tbody>
          <tr v-for="item in inventory" :key="item.id">
            <td>{{ productNames[item.productId] ?? item.productId }}</td>
            <td>{{ item.branchId }}</td>
            <td><span class="status-pill" :class="item.available <= item.reorderLevel ? 'tone-danger' : 'tone-success'">{{ item.available }}</span></td>
            <td>{{ item.reserved }}</td>
            <td>{{ item.incoming }}</td>
            <td>{{ item.damaged }}</td>
            <td>{{ item.reorderLevel }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="admin-panel">
    <h2>Stock movements</h2>
    <div class="admin-toolbar">
      <select v-model="movementsFilter" @change="loadMovements">
        <option value="">All products</option>
        <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }} ({{ p.sku }})</option>
      </select>
    </div>
    <div v-if="movementsLoading" class="loading-state" style="padding:20px">Loading&hellip;</div>
    <div v-else-if="!movements.length" class="empty-state" style="padding:20px"><h3>No movements</h3></div>
    <div v-else class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Product</th><th>Branch</th><th>Type</th><th>Qty</th><th>Reason</th><th>When</th></tr></thead>
        <tbody>
          <tr v-for="m in movements" :key="m.id">
            <td>{{ productNames[m.productId] ?? m.productId }}</td>
            <td>{{ m.branchId }}</td>
            <td>{{ humanize(m.type) }}</td>
            <td>{{ m.quantity }}</td>
            <td>{{ m.reason ?? '—' }}</td>
            <td>{{ new Date(m.createdAt).toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
