<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
import { addToCart } from '../lib/cart'
import { authStore } from '../lib/auth'

const router = useRouter()

const loading = ref(true)
const error = ref('')
const categories = ref([])
const featured = ref([])
const addStatus = ref({})
const email = ref('')
const subscribed = ref(false)

// Editorial mood imagery per category, kept from the original one-page design —
// decorative, not a claim about specific catalogue photos (products use an
// honest placeholder swatch instead, since the backend has no image field).
const CATEGORY_IMAGERY = {
  'women-formal': { image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1100&q=88', label: 'Made for the moment' },
  'men-formal': { image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1100&q=88', label: 'Tailored distinction' },
  fragrance: { image: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=1100&q=88', label: 'Your lasting signature' },
}
const FEATURED_SLUGS = ['women-formal', 'men-formal', 'fragrance']

function categoryImagery(category) {
  return CATEGORY_IMAGERY[category.slug] ?? { image: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1100&q=88', label: 'Shop the edit' }
}

async function loadHome() {
  try {
    const [categoryList, productList] = await Promise.all([api.listCategories(), api.listProducts()])
    const bySlug = new Map(categoryList.map((c) => [c.slug, c]))
    const ordered = FEATURED_SLUGS.map((slug) => bySlug.get(slug)).filter(Boolean)
    const rest = categoryList.filter((c) => !FEATURED_SLUGS.includes(c.slug))
    categories.value = [...ordered, ...rest].slice(0, 3)
    const active = productList.filter((p) => p.isActive)
    const featuredOnly = active.filter((p) => p.isFeatured)
    featured.value = (featuredOnly.length ? featuredOnly : active).slice(0, 4)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
function handleSync(event){if(event.detail?.resource==='products'||event.detail?.resource==='categories')loadHome()}
onMounted(()=>{loadHome();window.addEventListener('mk-sync',handleSync)})
onBeforeUnmount(()=>window.removeEventListener('mk-sync',handleSync))

async function quickAdd(product) {
  // Shopping (cart, product pages, shop) requires login — this button is the one
  // place on the home page that could add to cart without going through a guarded
  // route, so it needs the same check the router guard applies everywhere else.
  if (!authStore.user) {
    router.push({ path: '/login', query: { redirect: `/product/${product.id}` } })
    return
  }
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

function subscribe() {
  if (email.value.trim()) subscribed.value = true
}
</script>

<template>
  <section class="hero">
    <img src="https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1800&q=90" alt="Maps Kayz fashion campaign" />
    <div class="hero-shade"></div>
    <div class="hero-copy">
      <p class="eyebrow">The signature edit &middot; 2026</p>
      <h1>Style, made <em>unforgettable.</em></h1>
      <p>Curated fashion and authentic fragrances for every entrance, every occasion, every version of you.</p>
      <div class="hero-actions">
        <router-link class="gold-button" to="/shop">Shop new arrivals</router-link>
        <router-link class="hero-link" to="/categories">Browse categories <span>&rarr;</span></router-link>
      </div>
    </div>
    <div class="hero-side"><span>01</span><p>THE MIDNIGHT EDIT<br /><small>Formalwear reimagined</small></p></div>
  </section>

  <section class="benefits" aria-label="Store benefits">
    <div><strong>Authentic products</strong><span>Carefully sourced, always genuine</span></div>
    <div><strong>Nationwide delivery</strong><span>From Bulawayo to your door</span></div>
    <div><strong>Secure payments</strong><span>EcoCash, Paynow, Visa &amp; Mastercard</span></div>
    <div><strong>Personal styling</strong><span>Expert help via WhatsApp</span></div>
  </section>

  <p v-if="error" class="alert alert-error" style="max-width:1440px;margin:24px auto 0">{{ error }}</p>

  <section id="collections" class="section collections">
    <div class="section-heading">
      <div><p class="eyebrow dark">Find your moment</p><h2>Shop the collections</h2></div>
      <router-link to="/categories" class="text-link">View all categories <span>&rarr;</span></router-link>
    </div>
    <div v-if="loading" class="loading-state">Loading categories&hellip;</div>
    <div v-else class="collection-grid">
      <router-link v-for="(category, index) in categories" :key="category.id" :to="`/shop?category=${category.slug}`" class="collection-card">
        <img :src="categoryImagery(category).image" :alt="category.name" />
        <div class="collection-shade"></div>
        <span class="card-index">0{{ index + 1 }}</span>
        <div class="collection-copy">
          <p>{{ categoryImagery(category).label }}</p>
          <h3>{{ category.name }}</h3>
          <span>Explore collection <span>&rarr;</span></span>
        </div>
      </router-link>
    </div>
  </section>

  <section id="new" class="section arrivals">
    <div class="section-heading">
      <div><p class="eyebrow dark">Just landed</p><h2>New arrivals</h2></div>
      <router-link to="/shop" class="text-link">Shop all products <span>&rarr;</span></router-link>
    </div>
    <div v-if="loading" class="loading-state">Loading products&hellip;</div>
    <div v-else-if="!featured.length" class="empty-state"><h3>No products yet</h3><p>Add products from the admin panel to see them here.</p></div>
    <div v-else class="product-grid">
      <article v-for="product in featured" :key="product.id" class="product-card">
        <router-link :to="`/product/${product.id}`" class="product-media">
          <div class="product-swatch"><span>{{ product.name }}</span></div>
          <span v-if="product.isFeatured" class="product-tag">FEATURED</span>
        </router-link>
        <p class="product-category">{{ product.category }}</p>
        <router-link :to="`/product/${product.id}`"><h3>{{ product.name }}</h3></router-link>
        <div class="product-bottom">
          <strong>US${{ Number(product.price).toFixed(2) }}</strong>
          <button class="add-button" aria-label="Add to cart" :disabled="addStatus[product.id] === 'adding'" @click="quickAdd(product)">＋</button>
        </div>
        <p v-if="addStatus[product.id] === 'added'" class="stock-note">Added to cart</p>
        <p v-else-if="addStatus[product.id] && addStatus[product.id] !== 'adding'" class="stock-note out">{{ addStatus[product.id] }}</p>
      </article>
    </div>
  </section>

  <section id="looks" class="look-section">
    <div class="look-image">
      <img src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1200&q=88" alt="A considered formal outfit" />
    </div>
    <div class="look-copy">
      <span class="look-number">MK <small>05</small></span>
      <p class="eyebrow">Your wardrobe, considered</p>
      <h2>Complete <em>the look.</em></h2>
      <p>Build a head-to-toe outfit in a few thoughtful steps. Choose your foundation, refine every detail, and finish with a signature scent.</p>
      <router-link class="gold-button" to="/shop">Start styling</router-link>
      <div class="look-steps">
        <span><b>01</b>Choose the occasion</span>
        <span><b>02</b>Select your foundation</span>
        <span><b>03</b>Add the finishing touch</span>
      </div>
    </div>
  </section>

  <section id="story" class="newsletter">
    <p class="eyebrow dark">The private list</p>
    <h2>First access.<br /><em>Considered style.</em></h2>
    <p>New collections, private offers and styling notes &mdash; delivered with restraint.</p>
    <form @submit.prevent="subscribe">
      <template v-if="!subscribed">
        <label for="email">Email address</label>
        <input id="email" v-model="email" type="email" placeholder="you@example.com" required />
        <button type="submit">Join the list <span>&rarr;</span></button>
      </template>
      <p v-else class="success">You&rsquo;re on the list. Welcome in.</p>
    </form>
  </section>
</template>
