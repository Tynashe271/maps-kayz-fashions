<script setup>
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const embedded = window.parent !== window

// Per-route <title> and search-engine indexing. Everything not listed here
// falls back to the site title and stays indexable; routes that require a
// login (or are pure utility, like the 404) are marked noindex since a
// crawler only ever sees them logged out or empty.
const PAGE_TITLES = {
  home: 'DripHub — Wear Your Story',
  shop: 'Shop | DripHub',
  product: 'Product | DripHub',
  categories: 'Categories | DripHub',
  cart: 'Your Cart | DripHub',
  checkout: 'Checkout | DripHub',
  returns: 'Returns & Exchanges | DripHub',
  'track-order': 'Track Your Order | DripHub',
  login: 'Log In | DripHub',
  register: 'Create an Account | DripHub',
  account: 'My Account | DripHub',
  'not-found': 'Page Not Found | DripHub',
}
const NOINDEX_ROUTES = new Set(['login', 'register', 'account', 'cart', 'checkout', 'pay', 'not-found'])

function setRobotsMeta(noindex) {
  let tag = document.head.querySelector('meta[name="robots"]')
  if (!noindex) {
    tag?.remove()
    return
  }
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', 'robots')
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', 'noindex, nofollow')
}

onMounted(() => {
  if (embedded) document.documentElement.classList.add('mobile-app-embedded')
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('mobile-app-embedded')
  document.documentElement.classList.remove('mobile-app-landing')
})

watch(
  () => route.fullPath,
  (path) => {
    document.documentElement.classList.toggle('mobile-app-landing', embedded && route.name === 'home')
    document.title = PAGE_TITLES[route.name] ?? 'DripHub — Wear Your Story'
    setRobotsMeta(NOINDEX_ROUTES.has(route.name))
    if (embedded) {
      window.parent.postMessage({ type: 'maps-kayz-route', path }, '*')
    }
  },
  { immediate: true },
)
</script>

<template>
  <router-view />
</template>
