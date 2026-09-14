<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../lib/api'
import { addToCart } from '../lib/cart'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const products = ref([])
const categories = ref([])
const addStatus = ref({})

const search = ref(route.query.search ?? '')
const category = ref(route.query.category ?? '')

async function load() {
  loading.value = true
  error.value = ''
  try {
    products.value = await api.listProducts({ category: category.value || undefined, search: search.value || undefined })
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Independent requests — run in parallel instead of waiting on categories before
  // even starting the products fetch.
  api.listCategories().then((list) => { categories.value = list }).catch(() => {
    // Category filter is a convenience — an empty list just hides the dropdown's options.
  })
  load()
  window.addEventListener('mk-sync', handleSync)
})
onBeforeUnmount(()=>window.removeEventListener('mk-sync',handleSync))
function handleSync(event){if(event.detail?.resource==='products')load()}

watch(() => [route.query.category, route.query.search], ([nextCategory, nextSearch]) => {
  category.value = nextCategory ?? ''
  search.value = nextSearch ?? ''
  load()
})

function applyFilters() {
  router.push({ query: { category: category.value || undefined, search: search.value || undefined } })
}

async function quickAdd(product) {
  addStatus.value = { ...addStatus.value, [product.id]: 'adding' }
  try {
    await addToCart({ productId: product.id, quantity: 1, size: product.sizes?.[0], colour: product.colours?.[0] })
    addStatus.value = { ...addStatus.value, [product.id]: 'added' }
  } catch (err) {
    addStatus.value = { ...addStatus.value, [product.id]: err.message }
  } finally {
    setTimeout(() => { addStatus.value = { ...addStatus.value, [product.id]: undefined } }, 2200)
  }
}

// Only active products are offered to shoppers; the backend's public list endpoint
// does not filter this out itself, so we do it here to avoid selling retired stock.
const visibleProducts = ref([])
watch(products, (list) => { visibleProducts.value = list.filter((p) => p.isActive) }, { immediate: true })
</script>

<template>
  <div class="page-header">
    <p class="eyebrow dark">The full range</p>
    <h1>Shop</h1>
    <p>Browse every piece in the current collection, filtered by category or search.</p>
  </div>

  <div class="shop-toolbar">
    <div class="shop-filters">
      <select v-model="category" @change="applyFilters">
        <option value="">All categories</option>
        <option v-for="c in categories" :key="c.id" :value="c.slug">{{ c.name }}</option>
      </select>
      <form @submit.prevent="applyFilters">
        <input v-model="search" type="search" placeholder="Search by name, SKU or brand" />
      </form>
      <button class="btn btn-ghost btn-sm" type="button" @click="applyFilters">Apply</button>
    </div>
    <span class="shop-count" v-if="!loading">{{ visibleProducts.length }} product{{ visibleProducts.length === 1 ? '' : 's' }}</span>
  </div>

  <p v-if="error" class="alert alert-error" style="max-width:1440px;margin:20px auto 0 auto">{{ error }}</p>

  <div v-if="loading" class="loading-state">Loading products&hellip;</div>
  <div v-else-if="!visibleProducts.length" class="empty-state">
    <h3>No products match</h3>
    <p>Try a different category or search term.</p>
  </div>
  <div v-else class="section" style="padding-top:24px">
    <div class="product-grid">
      <article v-for="product in visibleProducts" :key="product.id" class="product-card">
        <router-link :to="`/product/${product.id}`" class="product-media">
          <div class="product-swatch"><span>{{ product.name }}</span></div>
          <span v-if="product.originalPrice" class="product-tag">SALE</span>
        </router-link>
        <p class="product-category">{{ product.category }}</p>
        <router-link :to="`/product/${product.id}`"><h3>{{ product.name }}</h3></router-link>
        <div class="product-bottom">
          <strong>
            US${{ Number(product.price).toFixed(2) }}
            <s v-if="product.originalPrice" style="color:var(--muted);font-size:12px;margin-left:6px">US${{ Number(product.originalPrice).toFixed(2) }}</s>
          </strong>
          <button class="shop-add-cart" aria-label="Add to cart" :disabled="addStatus[product.id] === 'adding'" @click="quickAdd(product)">{{ addStatus[product.id] === 'adding' ? 'Adding…' : addStatus[product.id] === 'added' ? 'Added ✓' : 'Add to cart' }}</button>
        </div>
        <p v-if="addStatus[product.id] === 'added'" class="stock-note">Added to cart</p>
        <p v-else-if="addStatus[product.id] && addStatus[product.id] !== 'adding'" class="stock-note out">{{ addStatus[product.id] }}</p>
      </article>
    </div>
  </div>
</template>
