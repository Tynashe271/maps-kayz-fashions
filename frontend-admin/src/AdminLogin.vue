<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@store/lib/api'
import { setSession } from '@store/lib/auth'

const router = useRouter()
const storefrontUrl = import.meta.env.VITE_STOREFRONT_URL ?? (import.meta.env.PROD ? 'https://shop.tinashenyenyesa.co.zw' : 'http://localhost:9990')
const email = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')

async function login() {
  error.value = ''
  busy.value = true
  try {
    const session = await api.login({ email: email.value.trim(), password: password.value })
    if (!['super_admin', 'owner', 'manager', 'staff'].includes(session.user?.role)) {
      error.value = 'This portal is only available to authorised staff.'
      return
    }
    setSession(session.user, session.accessToken, true)
    await router.replace('/')
  } catch (err) {
    error.value = err?.message || 'Unable to sign in. Check your details and try again.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="admin-welcome">
    <div class="admin-welcome-glow one"></div>
    <div class="admin-welcome-glow two"></div>

    <header class="admin-welcome-nav">
      <a class="admin-welcome-brand" href="/login" aria-label="Maps Kayz admin home">
        <img src="/admin-logo-mark.svg" alt="" width="50" height="50">
        <div><strong>Maps Kayz</strong><small>Operations Portal</small></div>
      </a>
      <div class="admin-welcome-nav-right">
        <span><i></i> Systems online</span>
        <a :href="storefrontUrl">View customer shop ↗</a>
      </div>
    </header>

    <section class="admin-welcome-main">
      <div class="admin-welcome-copy">
        <p class="admin-welcome-eyebrow"><span>01</span> Store command centre</p>
        <h1>Everything behind the<br><em>Maps Kayz</em> experience.</h1>
        <p class="admin-welcome-intro">Manage products, fulfil orders and look after customers from one connected workspace.</p>

        <div class="admin-welcome-capabilities" aria-label="Admin capabilities">
          <article><b>01</b><span>Catalogue</span><small>Products & stock</small></article>
          <article><b>02</b><span>Commerce</span><small>Orders & delivery</small></article>
          <article><b>03</b><span>Community</span><small>Customers & support</small></article>
        </div>
      </div>

      <aside class="admin-access-card">
        <div class="admin-access-heading">
          <p>Secure staff access</p>
          <span>Admin</span>
        </div>
        <h2>Welcome back.</h2>
        <p class="admin-access-subtitle">Sign in to continue to your operations dashboard.</p>

        <form @submit.prevent="login">
          <label>
            <span>Email address</span>
            <input v-model="email" type="email" autocomplete="username" required placeholder="admin@mapskayz.com">
          </label>
          <label>
            <span>Password</span>
            <input v-model="password" type="password" autocomplete="current-password" required placeholder="Enter your password">
          </label>
          <p v-if="error" class="admin-login-error" role="alert">{{ error }}</p>
          <button class="admin-access-button" type="submit" :disabled="busy">
            <span>{{ busy ? 'Signing in…' : 'Enter admin workspace' }}</span><b>→</b>
          </button>
        </form>

        <div class="admin-access-footer">
          <span>Protected staff area</span>
          <small>Backend connected on port 9200</small>
        </div>
      </aside>
    </section>

    <footer class="admin-welcome-footer">
      <span>Maps Kayz Fashions</span>
      <span>Bulawayo · Zimbabwe</span>
      <span>Administration / 2026</span>
    </footer>
  </main>
</template>
