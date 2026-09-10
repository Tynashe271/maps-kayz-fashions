<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { authStore, clearSession } from '../lib/auth'
import { cartStore, refreshCart } from '../lib/cart'
import { CONTACT } from '../lib/contact'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const showBackButton = computed(() => route.name !== 'home' && !(route.name === 'account' && (!route.query.tab || route.query.tab === 'overview')))
const menuOpen = ref(false)
const pageSceneCanvas = ref(null)

let disposePageScene = () => {}
let unmounted = false

onMounted(() => {
  const isAuthPage = route.name === 'login' || route.name === 'register'
  if (!isAuthPage) refreshCart()

  const canvas = pageSceneCanvas.value
  if (!canvas || isAuthPage) return

  // Three.js is ~500KB and purely decorative (the background orb animation) — loading
  // it as a separate chunk after mount, instead of bundling it into this layout (which
  // wraps every storefront page), keeps that weight off the critical path for pages
  // that have nothing to do with it, like Login or Checkout.
  const loadScene = () => import('three').then((THREE) => {
      if (unmounted || pageSceneCanvas.value !== canvas) return
      startPageScene(THREE, canvas)
    })
  if ('requestIdleCallback' in window) window.requestIdleCallback(loadScene, { timeout: 2500 })
  else window.setTimeout(loadScene, 800)
})

function startPageScene(THREE, canvas) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
  camera.position.set(0, 0, 8)
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.outputColorSpace = THREE.SRGBColorSpace

  scene.add(new THREE.AmbientLight(0xffe8ee, 1.8))
  const light = new THREE.PointLight(0xf2a8c4, 5, 16)
  light.position.set(3, 2, 4)
  scene.add(light)

  const pink = new THREE.MeshStandardMaterial({ color: 0xf2a8c4, roughness: 0.3, metalness: 0.25 })
  const pale = new THREE.MeshStandardMaterial({ color: 0xf7f2ea, roughness: 0.45, metalness: 0.1 })
  const group = new THREE.Group()
  scene.add(group)

  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 2), pink)
  orb.scale.set(1.25, 1.25, 0.55)
  group.add(orb)

  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.018, 12, 100), pale)
  outerRing.rotation.x = Math.PI / 2.8
  group.add(outerRing)
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.012, 10, 80), pink)
  innerRing.rotation.y = Math.PI / 2.2
  group.add(innerRing)

  const particleGeometry = new THREE.SphereGeometry(0.025, 8, 8)
  const particles = new THREE.Group()
  for (let index = 0; index < 28; index += 1) {
    const particle = new THREE.Mesh(particleGeometry, index % 4 === 0 ? pink : pale)
    const angle = (index / 28) * Math.PI * 2
    particle.position.set(Math.cos(angle) * (2.2 + Math.random() * 0.5), (Math.random() - 0.5) * 4.6, Math.sin(angle) * 1.2)
    particles.add(particle)
  }
  group.add(particles)

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  let frame = 0
  const render = (time = 0) => {
    group.rotation.y = time * 0.00012
    group.rotation.x = Math.sin(time * 0.00045) * 0.12
    outerRing.rotation.z = time * 0.00025
    innerRing.rotation.z = -time * 0.0004
    particles.rotation.y = -time * 0.00016
    group.position.y = Math.sin(time * 0.0008) * 0.15
    renderer.render(scene, camera)
    frame = requestAnimationFrame(render)
  }
  frame = requestAnimationFrame(render)

  disposePageScene = () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('resize', resize)
    renderer.dispose()
    orb.geometry.dispose()
    outerRing.geometry.dispose()
    innerRing.geometry.dispose()
    particleGeometry.dispose()
    pink.dispose()
    pale.dispose()
  }
}

onUnmounted(() => {
  unmounted = true
  disposePageScene()
})

function logout() {
  clearSession()
  menuOpen.value = false
  router.replace({ name: 'home' })
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <div class="storefront">
    <a class="skip-link" href="#main">Skip to content</a>
    <div class="announcement"><span>Complimentary Bulawayo delivery on orders over US$80</span><b>&bull;</b><span>Nationwide delivery available</span></div>

    <header class="site-header">
      <router-link class="brand" to="/" aria-label="Maps Kayz Fashions home"><img class="monogram" src="/logo-mark.svg" alt="" width="64" height="64" /><span class="brand-name">MAPS KAYZ<small>FASHIONS &middot; BYO</small></span></router-link>
      <nav :class="{ open: menuOpen }" aria-label="Main navigation">
        <router-link to="/shop" @click="menuOpen = false">Shop</router-link>
        <router-link to="/categories" @click="menuOpen = false">Categories</router-link>
        <router-link to="/#story" @click="menuOpen = false">About</router-link>
      </nav>
      <div class="header-actions">
        <router-link to="/cart" aria-label="Shopping cart">Cart <b>{{ cartStore.itemCount }}</b></router-link>
        <router-link v-if="!authStore.user" to="/login">Login</router-link>
        <template v-else>
          <router-link to="/account">{{ authStore.user.email.split('@')[0] }}</router-link>
          <button type="button" class="text-button" @click="logout">Logout</button>
        </template>
        <button class="menu-button" aria-label="Toggle menu" @click="menuOpen = !menuOpen">&#9776;</button>
      </div>
    </header>

    <main id="main">
      <button v-if="showBackButton" type="button" class="page-back-button" aria-label="Go back to previous page" @click="goBack"><span>&larr;</span> Back</button>
      <router-view />
    </main>

    <footer>
      <div class="footer-brand">
        <router-link class="brand" to="/"><img class="monogram" src="/logo-mark.svg" alt="" width="64" height="64" /><span class="brand-name">MAPS KAYZ<small>FASHIONS &middot; BYO</small></span></router-link>
        <p>Style for every occasion.<br />Bulawayo, Zimbabwe.</p>
      </div>
      <div><h3>SHOP</h3><router-link to="/shop">All products</router-link><router-link to="/shop?category=women-formal">Women</router-link><router-link to="/shop?category=men-formal">Men</router-link><router-link to="/categories">Categories</router-link></div>
      <div>
        <h3>CONTACT</h3>
        <a :href="`mailto:${CONTACT.email}`">{{ CONTACT.email }}</a>
        <a :href="`tel:+${CONTACT.phoneIntl}`">{{ CONTACT.phoneDisplay }}</a>
        <router-link to="/cart">Delivery &amp; cart</router-link>
        <router-link to="/track-order">Track order</router-link>
        <router-link to="/returns">Returns &amp; exchanges</router-link>
        <router-link to="/account">Dashboard</router-link>
      </div>
      <div>
        <h3>FOLLOW</h3>
        <a :href="CONTACT.whatsappUrl" target="_blank" rel="noopener">WhatsApp</a>
        <a :href="CONTACT.tiktokUrl" target="_blank" rel="noopener">TikTok {{ CONTACT.tiktokHandle }}</a>
        <a :href="CONTACT.facebookUrl" target="_blank" rel="noopener">Facebook &middot; {{ CONTACT.facebookLabel }}</a>
      </div>
    </footer>
    <a class="whatsapp" :href="CONTACT.whatsappUrl" aria-label="Chat with Maps Kayz Fashions on WhatsApp" target="_blank" rel="noopener">WA</a>
  </div>
</template>
