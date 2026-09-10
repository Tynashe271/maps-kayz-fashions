<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../../lib/api'

const loading = ref(true)
const error = ref('')
const categories = ref([])
const showForm = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')
const confirmingDeleteId = ref(null)

function emptyForm() { return { name: '', slug: '', parentId: '' } }
const form = ref(emptyForm())

async function load() {
  loading.value = true
  error.value = ''
  try {
    categories.value = await api.listCategories()
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

function openEdit(category) {
  editingId.value = category.id
  form.value = { name: category.name, slug: category.slug, parentId: category.parentId ?? '' }
  formError.value = ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = null
}

async function submitForm() {
  formError.value = ''
  const dto = { name: form.value.name, slug: form.value.slug, parentId: form.value.parentId || null }
  saving.value = true
  try {
    if (editingId.value) await api.updateCategory(editingId.value, dto)
    else await api.createCategory(dto)
    closeForm()
    await load()
  } catch (err) {
    formError.value = err.message
  } finally {
    saving.value = false
  }
}

async function confirmDelete(category) {
  if (confirmingDeleteId.value !== category.id) {
    confirmingDeleteId.value = category.id
    return
  }
  error.value = ''
  try {
    await api.deleteCategory(category.id)
    confirmingDeleteId.value = null
    await load()
  } catch (err) {
    error.value = err.message
  }
}

function parentName(id) {
  return categories.value.find((c) => c.id === id)?.name ?? '—'
}
</script>

<template>
  <div class="admin-page-header">
    <div><h1>Categories</h1><p>/api/categories &mdash; catalogue structure.</p></div>
    <button class="btn btn-primary btn-sm" type="button" @click="openCreate">New category</button>
  </div>

  <p v-if="error" class="alert alert-error">{{ error }}</p>

  <div class="admin-panel" v-if="showForm">
    <h2>{{ editingId ? 'Edit category' : 'New category' }}</h2>
    <p v-if="formError" class="alert alert-error">{{ formError }}</p>
    <form class="form-grid" @submit.prevent="submitForm">
      <div class="field"><label>Name</label><input v-model="form.name" required /></div>
      <div class="field"><label>Slug</label><input v-model="form.slug" required /></div>
      <div class="field span-2">
        <label>Parent category (optional)</label>
        <select v-model="form.parentId">
          <option value="">None</option>
          <option v-for="c in categories" :key="c.id" :value="c.id" :disabled="c.id === editingId">{{ c.name }}</option>
        </select>
      </div>
      <div class="form-actions span-2">
        <button class="btn btn-primary" type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save category' }}</button>
        <button class="btn btn-ghost" type="button" @click="closeForm">Cancel</button>
      </div>
    </form>
  </div>

  <div v-if="loading" class="loading-state">Loading&hellip;</div>
  <div v-else-if="!categories.length" class="empty-state"><h3>No categories</h3></div>
  <div v-else class="table-wrap">
    <table class="data-table">
      <thead><tr><th>Name</th><th>Slug</th><th>Parent</th><th></th></tr></thead>
      <tbody>
        <tr v-for="c in categories" :key="c.id">
          <td>{{ c.name }}</td>
          <td>{{ c.slug }}</td>
          <td>{{ c.parentId ? parentName(c.parentId) : '—' }}</td>
          <td>
            <div class="row-actions">
              <button class="btn btn-ghost btn-sm" type="button" @click="openEdit(c)">Edit</button>
              <button class="btn btn-danger btn-sm" type="button" @click="confirmDelete(c)">{{ confirmingDeleteId === c.id ? 'Confirm?' : 'Delete' }}</button>
              <button v-if="confirmingDeleteId === c.id" class="btn btn-ghost btn-sm" type="button" @click="confirmingDeleteId = null">Cancel</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
