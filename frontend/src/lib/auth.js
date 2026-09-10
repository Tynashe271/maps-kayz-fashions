import { reactive, computed } from 'vue'

const STAFF_ROLES = new Set(['super_admin', 'owner', 'manager', 'staff'])

function readStoredUser() {
  try {
    const raw = localStorage.getItem('mk_user') || sessionStorage.getItem('mk_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const authStore = reactive({
  user: readStoredUser(),
  token: localStorage.getItem('mk_token') || sessionStorage.getItem('mk_token') || null,
})

export const isStaff = computed(() => !!authStore.user && STAFF_ROLES.has(authStore.user.role))

export const roleLabels = {
  customer: 'Customer',
  super_admin: 'Super Admin',
  owner: 'Owner',
  manager: 'Manager',
  staff: 'Staff',
}

export function setSession(user, token, remember = true) {
  authStore.user = user
  authStore.token = token
  const storage = remember ? localStorage : sessionStorage
  const other = remember ? sessionStorage : localStorage
  storage.setItem('mk_user', JSON.stringify(user))
  storage.setItem('mk_token', token)
  other.removeItem('mk_user')
  other.removeItem('mk_token')
}

export function clearSession() {
  authStore.user = null
  authStore.token = null
  localStorage.removeItem('mk_user')
  localStorage.removeItem('mk_token')
  sessionStorage.removeItem('mk_user')
  sessionStorage.removeItem('mk_token')
}
