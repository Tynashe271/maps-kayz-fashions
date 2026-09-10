<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { api } from '../../lib/api'
import { PLATFORM_RESOURCES } from '../../lib/platformResources'

const resource = ref('faqs')
const loading = ref(false)
const error = ref('')
const records = ref([])

const showForm = ref(false)
const editingId = ref(null)
const formError = ref('')
const saving = ref(false)
const confirmingDeleteId = ref(null)

function emptyForm() { return { reference: '', data: '{}', active: true } }
const form = ref(emptyForm())

const capabilities = ref(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    records.value = await api.listPlatformRecords(resource.value)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  api.platformCapabilities().then((data) => { capabilities.value = data }).catch(() => { /* reference panel only */ })
  window.addEventListener('mk-sync', handleSync)
})
onBeforeUnmount(()=>window.removeEventListener('mk-sync',handleSync))
function handleSync(event){if(event.detail?.resource===resource.value)load()}

watch(resource, load)

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  formError.value = ''
  showForm.value = true
}

function openEdit(record) {
  editingId.value = record.id
  form.value = { reference: record.reference, data: JSON.stringify(record.data ?? {}, null, 2), active: record.active }
  formError.value = ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = null
}

async function submitForm() {
  formError.value = ''
  let data = {}
  const enteredData = form.value.data.trim()
  try {
    data = enteredData ? JSON.parse(enteredData) : {}
  } catch {
    data = { content: enteredData }
  }
  saving.value = true
  try {
    if (editingId.value) await api.updatePlatformRecord(resource.value, editingId.value, { reference: form.value.reference, data, active: form.value.active })
    else await api.createPlatformRecord(resource.value, { reference: form.value.reference, data, active: form.value.active })
    closeForm()
    await load()
  } catch (err) {
    formError.value = err.message
  } finally {
    saving.value = false
  }
}

async function confirmDelete(record) {
  if (confirmingDeleteId.value !== record.id) {
    confirmingDeleteId.value = record.id
    return
  }
  error.value = ''
  try {
    await api.deletePlatformRecord(resource.value, record.id)
    confirmingDeleteId.value = null
    await load()
  } catch (err) {
    error.value = err.message
  }
}
</script>

<template>
  <div class="admin-page-header">
    <div><h1>Platform records</h1><p>/api/platform/:resource &mdash; the generic flexible-record API behind {{ PLATFORM_RESOURCES.length }} extension resources.</p></div>
    <button class="btn btn-primary btn-sm" type="button" @click="openCreate">New record</button>
  </div>

  <p class="alert alert-info">
    Most of this backend's domains (FAQs, wishlists, reviews, loyalty, purchasing, and 150+ others) aren't first-class
    modules with their own validation &mdash; they share one generic reference + JSON-data record shape. Pick a resource
    below to browse or edit its records.
  </p>

  <div class="admin-toolbar">
    <select v-model="resource">
      <option v-for="r in PLATFORM_RESOURCES" :key="r" :value="r">{{ r }}</option>
    </select>
    <button class="btn btn-ghost btn-sm" type="button" @click="load">Refresh</button>
  </div>

  <p v-if="error" class="alert alert-error">{{ error }}</p>

  <div class="admin-panel" v-if="showForm">
    <h2>{{ editingId ? `Edit ${resource} record` : `New ${resource} record` }}</h2>
    <p v-if="formError" class="alert alert-error">{{ formError }}</p>
    <form class="form-grid single" @submit.prevent="submitForm">
      <div class="field"><label>Reference</label><input v-model="form.reference" required placeholder="A human-readable identifier, e.g. an order number or slug" /></div>
      <div class="field"><label>Details</label><textarea v-model="form.data" rows="6" placeholder="Enter the record details. Plain text and structured JSON are both supported."></textarea><small class="field-help">You can enter normal text. Structured JSON is optional.</small></div>
      <div class="field field-checkbox"><input id="active" v-model="form.active" type="checkbox" /><label for="active" style="text-transform:none">Active</label></div>
      <div class="form-actions">
        <button class="btn btn-primary" type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save record' }}</button>
        <button class="btn btn-ghost" type="button" @click="closeForm">Cancel</button>
      </div>
    </form>
  </div>

  <div v-if="loading" class="loading-state">Loading&hellip;</div>
  <div v-else-if="!records.length" class="empty-state"><h3>No {{ resource }} records yet</h3></div>
  <div v-else class="table-wrap">
    <table class="data-table">
      <thead><tr><th>Reference</th><th>Data</th><th>Status</th><th>Updated</th><th></th></tr></thead>
      <tbody>
        <tr v-for="r in records" :key="r.id">
          <td>{{ r.reference }}</td>
          <td><code style="font-size:11px">{{ JSON.stringify(r.data) }}</code></td>
          <td><span class="status-pill" :class="r.active ? 'tone-success' : 'tone-muted'">{{ r.active ? 'Active' : 'Inactive' }}</span></td>
          <td>{{ new Date(r.updatedAt).toLocaleString() }}</td>
          <td>
            <div class="row-actions">
              <button class="btn btn-ghost btn-sm" type="button" @click="openEdit(r)">Edit</button>
              <button class="btn btn-danger btn-sm" type="button" @click="confirmDelete(r)">{{ confirmingDeleteId === r.id ? 'Confirm?' : 'Delete' }}</button>
              <button v-if="confirmingDeleteId === r.id" class="btn btn-ghost btn-sm" type="button" @click="confirmingDeleteId = null">Cancel</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="admin-panel" v-if="capabilities">
    <h2>API reference</h2>
    <p class="field-help" style="margin-bottom:10px">Purpose-built domains with their own pages, from /api/platform/capabilities:</p>
    <div class="row-actions">
      <span v-for="(path, name) in capabilities.nativeDomains" :key="name" class="status-pill tone-muted">{{ name }}: {{ path }}</span>
    </div>
  </div>
</template>
