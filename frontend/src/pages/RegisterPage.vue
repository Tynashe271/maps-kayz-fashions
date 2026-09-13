<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../lib/api'

const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  submitting.value = true
  try {
    await api.register({ email: email.value, password: password.value, referralCode: typeof route.query.ref === 'string' ? route.query.ref : undefined })
    // Send the new customer to login rather than straight into the dashboard,
    // so every session starts with an explicit sign-in.
    router.push({ path: '/login', query: { ...route.query, registered: '1', email: email.value } })
  } catch (err) {
    error.value = err.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <h1>Create an account</h1>
    <p v-if="route.query.redirect">Create an account to continue &mdash; you'll be taken right back to where you were.</p>
    <p v-else>Save your details for a faster checkout next time.</p>

    <p v-if="error" class="alert alert-error">{{ error }}</p>

    <form class="form-grid single" @submit.prevent="submit">
      <div class="field">
        <label for="email">Email</label>
        <input id="email" v-model="email" type="email" autocomplete="email" required />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input id="password" v-model="password" type="password" autocomplete="new-password" minlength="8" required />
        <span class="field-help">At least 8 characters.</span>
      </div>
      <div class="field">
        <label for="confirm">Confirm password</label>
        <input id="confirm" v-model="confirmPassword" type="password" autocomplete="new-password" minlength="8" required />
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" type="submit" :disabled="submitting">{{ submitting ? 'Creating account…' : 'Create account' }}</button>
      </div>
    </form>

    <p class="auth-switch">Already have an account? <router-link :to="{ path: '/login', query: route.query }" class="text-link">Log in</router-link></p>
  </div>
</template>
