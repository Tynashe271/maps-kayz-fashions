<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../lib/api'

const loading = ref(true)
const error = ref('')
const categories = ref([])

onMounted(async () => {
  try {
    categories.value = await api.listCategories()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-header">
    <p class="eyebrow dark">Browse</p>
    <h1>Categories</h1>
    <p>Every category currently in the catalogue.</p>
  </div>

  <p v-if="error" class="alert alert-error error-state">{{ error }}</p>
  <div v-if="loading" class="loading-state">Loading categories&hellip;</div>
  <div v-else-if="!categories.length" class="empty-state">
    <h3>No categories yet</h3>
    <p>Add categories from the admin panel to see them here.</p>
  </div>
  <div v-else class="category-grid">
    <router-link v-for="category in categories" :key="category.id" :to="`/shop?category=${category.slug}`" class="category-card">
      <h3>{{ category.name }}</h3>
      <span>Shop {{ category.name }} &rarr;</span>
    </router-link>
  </div>
</template>
