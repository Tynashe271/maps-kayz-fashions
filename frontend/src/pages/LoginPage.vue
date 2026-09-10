<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../lib/api'
import { setSession, isStaff } from '../lib/auth'

const route = useRoute()
const router = useRouter()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const remember = ref(true)
const submitting = ref(false)
const error = ref('')
const destination = computed(() => {
  const value = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  return value.startsWith('/') && !value.startsWith('//') ? value : ''
})

async function submit() {
  submitting.value = true
  error.value = ''
  try {
    const result = await api.login({ email: email.value.trim(), password: password.value })
    setSession(result.user, result.accessToken, remember.value)
    await router.replace(destination.value || (isStaff.value ? '/admin' : '/account'))
  } catch (err) {
    error.value = err.status === 401 ? 'That email or password is not correct.' : err.message
  } finally {
    submitting.value = false
  }
}

</script>

<template>
  <section class="auth-shell">
    <div class="auth-visual">
      <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=88" alt="Maps Kayz tailored collection" />
      <div class="auth-visual-shade"></div>
      <div class="auth-visual-copy"><p class="eyebrow">Maps Kayz members</p><h1>Your style,<br><em>all in one place.</em></h1><p>Save your cart, move through checkout faster, and keep every order within reach.</p></div>
      <span class="auth-visual-index">MK / 01</span>
    </div>
    <div class="auth-panel">
      <div class="auth-panel-inner">
        <p class="eyebrow dark">Welcome back</p>
        <h2>Log in to your account</h2>
        <p class="auth-lead">{{ destination ? 'Sign in to continue where you left off.' : 'Enter your details to access your customer dashboard.' }}</p>
        <div v-if="error" class="auth-error" role="alert"><span>!</span><p>{{ error }}</p></div>
        <form class="auth-form" @submit.prevent="submit">
          <label for="email">Email address</label>
          <input id="email" v-model="email" type="email" autocomplete="email" placeholder="you@example.com" required autofocus />
          <div class="password-label"><label for="password">Password</label><a href="mailto:mapskayzfashions@gmail.com?subject=Password reset help">Forgot password?</a></div>
          <div class="password-input"><input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="Enter your password" required /><button type="button" @click="showPassword = !showPassword">{{ showPassword ? 'Hide' : 'Show' }}</button></div>
          <label class="remember-row"><input v-model="remember" type="checkbox" /><span>Keep me signed in on this device</span></label>
          <button class="auth-submit" type="submit" :disabled="submitting"><span>{{ submitting ? 'Signing you in…' : 'Log in' }}</span><b>&rarr;</b></button>
        </form>
        <p class="auth-switch">New to Maps Kayz? <router-link :to="{ path: '/register', query: route.query }">Create an account</router-link></p>
        <p class="auth-note">Protected by secure, encrypted authentication.</p>
      </div>
    </div>
  </section>
</template>
