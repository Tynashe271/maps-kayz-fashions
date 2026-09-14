<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../lib/api'
import { addToCart } from '../lib/cart'

const props = defineProps({ id: { type: String, required: true } })
const route = useRoute()

const loading = ref(true)
const notFound = ref(false)
const error = ref('')
const product = ref(null)
const selectedSize = ref('')
const selectedColour = ref('')
const quantity = ref(1)
const addState = ref('idle')
const addError = ref('')
const savedState = ref('idle')

async function load(id) {
  loading.value = true
  notFound.value = false
  error.value = ''
  addState.value = 'idle'
  try {
    product.value = await api.getProduct(id)
    selectedSize.value = product.value.sizes?.[0] ?? ''
    selectedColour.value = product.value.colours?.[0] ?? ''
    quantity.value = 1
    api.createDashboardRecord('search-history', { productId: product.value.id, name: product.value.name, price: Number(product.value.price), stock: product.value.stock, sizes: product.value.sizes, viewedAt: new Date().toISOString() }).catch(() => {})
  } catch (err) {
    if (err.status === 404) notFound.value = true
    else error.value = err.message
  } finally {
    loading.value = false
  }
}

watch(() => props.id ?? route.params.id, (id) => { if (id) load(id) }, { immediate: true })
function handleSync(event){if(event.detail?.resource==='products'&&(!event.detail.id||event.detail.id===product.value?.id))load(props.id??route.params.id)}
onMounted(()=>window.addEventListener('mk-sync',handleSync))
onBeforeUnmount(()=>window.removeEventListener('mk-sync',handleSync))

const maxQuantity = computed(() => product.value?.stock ?? 1)

function changeQuantity(delta) {
  quantity.value = Math.min(maxQuantity.value, Math.max(1, quantity.value + delta))
}

async function submitAdd() {
  addState.value = 'adding'
  addError.value = ''
  try {
    await addToCart({
      productId: product.value.id,
      quantity: quantity.value,
      size: selectedSize.value || undefined,
      colour: selectedColour.value || undefined,
    })
    addState.value = 'added'
  } catch (err) {
    addState.value = 'error'
    addError.value = err.message
  }
}

async function saveToWishlist() {
  savedState.value = 'saving'
  try {
    await api.createDashboardRecord('wishlists', { productId: product.value.id, name: product.value.name, price: Number(product.value.price), stock: product.value.stock, size: selectedSize.value, colour: selectedColour.value, note: '' })
    savedState.value = 'saved'
  } catch (err) {
    savedState.value = 'error'
    addError.value = err.message
  }
}
</script>

<template>
  <div v-if="loading" class="loading-state">Loading product&hellip;</div>
  <div v-else-if="notFound" class="empty-state">
    <h3>Product not found</h3>
    <p>It may have been removed. <router-link to="/shop" class="text-link">Back to shop</router-link></p>
  </div>
  <p v-else-if="error" class="alert alert-error" style="max-width:1440px;margin:24px auto">{{ error }}</p>

  <div v-else-if="product" class="product-detail">
    <div class="product-detail-media">
      <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" class="product-photo" />
      <div v-else class="product-swatch" style="height:100%"><span>{{ product.name }}</span></div>
    </div>
    <div class="product-detail-body">
      <p class="eyebrow">{{ product.brand }} &middot; {{ product.category }}</p>
      <h1>{{ product.name }}</h1>
      <div class="product-detail-price">
        <span>US${{ Number(product.price).toFixed(2) }}</span>
        <s v-if="product.originalPrice">US${{ Number(product.originalPrice).toFixed(2) }}</s>
      </div>
      <p class="description">{{ product.description }}</p>

      <div v-if="product.colours?.length" class="option-group">
        <h4>Colour</h4>
        <div class="option-pills">
          <button v-for="c in product.colours" :key="c" type="button" class="option-pill" :class="{ active: selectedColour === c }" @click="selectedColour = c">{{ c }}</button>
        </div>
      </div>

      <div v-if="product.sizes?.length" class="option-group">
        <h4>Size</h4>
        <div class="option-pills">
          <button v-for="s in product.sizes" :key="s" type="button" class="option-pill" :class="{ active: selectedSize === s }" @click="selectedSize = s">{{ s }}</button>
        </div>
      </div>

      <div class="qty-row">
        <div class="qty-control">
          <button type="button" @click="changeQuantity(-1)" :disabled="quantity <= 1">&minus;</button>
          <span>{{ quantity }}</span>
          <button type="button" @click="changeQuantity(1)" :disabled="quantity >= maxQuantity">+</button>
        </div>
        <span v-if="product.stock < 1" class="stock-note out">Out of stock</span>
        <span v-else-if="product.stock <= 5" class="stock-note low">Only {{ product.stock }} left in stock</span>
        <span v-else class="stock-note">{{ product.stock }} in stock</span>
      </div>

      <div class="hero-actions" style="margin:0">
        <button class="gold-button" type="button" :disabled="product.stock < 1 || addState === 'adding'" @click="submitAdd">
          {{ product.stock < 1 ? 'Out of stock' : addState === 'adding' ? 'Adding…' : 'Add to cart' }}
        </button>
        <router-link v-if="addState === 'added'" to="/cart" class="hero-link">View cart <span>&rarr;</span></router-link>
        <button class="btn btn-ghost" type="button" :disabled="savedState === 'saving' || savedState === 'saved'" @click="saveToWishlist">{{ savedState === 'saved' ? 'Saved to wishlist ✓' : savedState === 'saving' ? 'Saving…' : 'Save to wishlist' }}</button>
      </div>
      <p v-if="addState === 'error'" class="alert alert-error" style="margin-top:18px">{{ addError }}</p>
      <p v-if="addState === 'added'" class="alert alert-success" style="margin-top:18px">Added to your cart.</p>
    </div>
  </div>
</template>
