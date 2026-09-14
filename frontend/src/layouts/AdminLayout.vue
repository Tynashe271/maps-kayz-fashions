<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authStore, roleLabels, clearSession } from '../lib/auth'

const router = useRouter()
const route = useRoute()
const showBackButton = computed(() => route.name !== 'admin-dashboard')
// Falls back to localhost for local dev; set at build time for deployed
// environments (see frontend-admin/.env.production.example).
const storefrontUrl = import.meta.env.VITE_STOREFRONT_URL ?? (import.meta.env.PROD ? 'https://shop.tinashenyenyesa.co.zw' : 'http://localhost:9990')

const mobileNavOpen = ref(false)
// A tap on any nav link (or the back button) navigates, which should also
// close the drawer — watching the route is simpler than wiring @click on
// every link individually.
watch(() => route.fullPath, () => { mobileNavOpen.value = false })

const links = [
  { to: '/', label: 'Dashboard', exact: true },
  { to: '/products', label: 'Products' },
  { to: '/categories', label: 'Categories' },
  { to: '/customers', label: 'Customers' },
  { to: '/orders', label: 'Orders' },
  { to: '/promotions', label: 'Promotions' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/suppliers', label: 'Suppliers' },
  { to: '/deliveries', label: 'Deliveries' },
  { to: '/returns', label: 'Returns' },
  { to: '/platform', label: 'Customer activity' },
]

function logout() {
  clearSession()
  router.replace({ name: 'admin-login' })
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <div class="admin-shell" :class="{ 'nav-open': mobileNavOpen }">
    <div v-if="mobileNavOpen" class="admin-nav-backdrop" @click="mobileNavOpen = false"></div>
    <aside class="admin-sidebar">
      <router-link class="admin-brand" to="/"><img src="/admin-logo-mark.svg" alt="Maps Kayz Admin" width="42" height="42" /><span>MAPS KAYZ<small>ADMINISTRATION</small></span></router-link>
      <nav>
        <router-link v-for="link in links" :key="link.to" :to="link.to" :class="{ active: link.exact ? $route.path === link.to : $route.path.startsWith(link.to) }">{{ link.label }}</router-link>
      </nav>
      <a class="admin-view-store" :href="storefrontUrl">&larr; View storefront</a>
    </aside>
    <div class="admin-body">
      <header class="admin-topbar">
        <div class="admin-topbar-left">
          <button type="button" class="admin-menu-button" aria-label="Toggle menu" @click="mobileNavOpen = !mobileNavOpen">&#9776;</button>
          <div v-if="authStore.user"><strong>{{ authStore.user.email }}</strong><span>{{ roleLabels[authStore.user.role] ?? authStore.user.role }}</span></div>
        </div>
        <button type="button" class="btn btn-ghost" @click="logout">Logout</button>
      </header>
      <main class="admin-main">
        <button v-if="showBackButton" type="button" class="page-back-button admin-back-button" @click="goBack"><span>&larr;</span> Back</button>
        <router-view />
      </main>
    </div>
  </div>
</template>
