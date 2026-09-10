<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../../lib/api'

const loading = ref(true)
const error = ref('')
const promotions = ref([])
const showForm = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')

function emptyForm() { return { code: '', type: 'percentage', value: '', active: true } }
const form = ref(emptyForm())

async function load() {
  loading.value = true
  error.value = ''
  try {
    promotions.value = await api.listPromotions()
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

function openEdit(promo) {
  editingId.value = promo.id
  form.value = { code: promo.code, type: promo.type, value: promo.value, active: promo.active }
  formError.value = ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = null
}

async function submitForm() {
  formError.value = ''
  const dto = { code: form.value.code, type: form.value.type, value: Number(form.value.value), active: !!form.value.active }
  saving.value = true
  try {
    if (editingId.value) await api.updatePromotion(editingId.value, dto)
    else await api.createPromotion(dto)
    closeForm()
    await load()
  } catch (err) {
    formError.value = err.message
  } finally {
    saving.value = false
  }
}

async function toggleActive(promo) {
  error.value = ''
  try {
    await api.updatePromotion(promo.id, { active: !promo.active })
    await load()
  } catch (err) {
    error.value = err.message
  }
}
</script>

<template>
  <div class="admin-page-header">
    <div><h1>Promotions</h1><p>/api/promotions &mdash; discount codes.</p></div>
    <button class="btn btn-primary btn-sm" type="button" @click="openCreate">New promotion</button>
  </div>

  <p v-if="error" class="alert alert-error">{{ error }}</p>

  <div class="admin-panel" v-if="showForm">
    <h2>{{ editingId ? 'Edit promotion' : 'New promotion' }}</h2>
    <p v-if="formError" class="alert alert-error">{{ formError }}</p>
    <form class="form-grid" @submit.prevent="submitForm">
      <div class="field"><label>Code</label><input v-model="form.code" required style="text-transform:uppercase" /></div>
      <div class="field">
        <label>Type</label>
        <select v-model="form.type"><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select>
      </div>
      <div class="field"><label>Value</label><input v-model="form.value" type="number" min="0" step="0.01" required /></div>
      <div class="field field-checkbox"><input id="active" v-model="form.active" type="checkbox" /><label for="active" style="text-transform:none">Active</label></div>
      <div class="form-actions span-2">
        <button class="btn btn-primary" type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save promotion' }}</button>
        <button class="btn btn-ghost" type="button" @click="closeForm">Cancel</button>
      </div>
    </form>
  </div>

  <div v-if="loading" class="loading-state">Loading&hellip;</div>
  <div v-else-if="!promotions.length" class="empty-state"><h3>No promotions</h3></div>
  <div v-else class="table-wrap">
    <table class="data-table">
      <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Status</th><th></th></tr></thead>
      <tbody>
        <tr v-for="p in promotions" :key="p.id">
          <td>{{ p.code }}</td>
          <td>{{ p.type }}</td>
          <td>{{ p.type === 'percentage' ? `${p.value}%` : `US$${Number(p.value).toFixed(2)}` }}</td>
          <td><span class="status-pill" :class="p.active ? 'tone-success' : 'tone-muted'">{{ p.active ? 'Active' : 'Inactive' }}</span></td>
          <td>
            <div class="row-actions">
              <button class="btn btn-ghost btn-sm" type="button" @click="openEdit(p)">Edit</button>
              <button class="btn btn-ghost btn-sm" type="button" @click="toggleActive(p)">{{ p.active ? 'Deactivate' : 'Activate' }}</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
