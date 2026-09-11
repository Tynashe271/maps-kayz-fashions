import { createRouter, createWebHistory } from 'vue-router'
import { authStore } from '../lib/auth'

const StorefrontLayout = () => import('../layouts/StorefrontLayout.vue')

const HomePage = () => import('../pages/HomePage.vue')
const ShopPage = () => import('../pages/ShopPage.vue')
const ProductPage = () => import('../pages/ProductPage.vue')
const CategoriesPage = () => import('../pages/CategoriesPage.vue')
const CartPage = () => import('../pages/CartPage.vue')
const CheckoutPage = () => import('../pages/CheckoutPage.vue')
const ReturnsPage = () => import('../pages/ReturnsPage.vue')
const TrackOrderPage = () => import('../pages/TrackOrderPage.vue')
const PaymentPage = () => import('../pages/PaymentPage.vue')
const LoginPage = () => import('../pages/LoginPage.vue')
const RegisterPage = () => import('../pages/RegisterPage.vue')
const AccountPage = () => import('../pages/AccountPage.vue')
const NotFoundPage = () => import('../pages/NotFoundPage.vue')


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    // Dashboard tabs use a query value. Switching tabs should replace the
    // content in place instead of jumping the customer back to the page top.
    if (to.path === from.path && to.name === 'account' && to.query.tab !== from.query.tab) return false
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      component: StorefrontLayout,
      children: [
        { path: '', name: 'home', component: HomePage },
        { path: 'shop', name: 'shop', component: ShopPage, meta: { requiresAuth: true } },
        { path: 'product/:id', name: 'product', component: ProductPage, props: true, meta: { requiresAuth: true } },
        { path: 'categories', name: 'categories', component: CategoriesPage, meta: { requiresAuth: true } },
        { path: 'cart', name: 'cart', component: CartPage, meta: { requiresAuth: true } },
        { path: 'checkout', name: 'checkout', component: CheckoutPage, meta: { requiresAuth: true } },
        { path: 'returns', name: 'returns', component: ReturnsPage },
        { path: 'track-order', name: 'track-order', component: TrackOrderPage },
        { path: 'pay/:orderNumber', name: 'pay', component: PaymentPage },
        { path: 'login', name: 'login', component: LoginPage },
        { path: 'register', name: 'register', component: RegisterPage },
        { path: 'account', alias: 'dashboard', name: 'account', component: AccountPage, meta: { requiresAuth: true } },
      ],
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundPage },
  ],
})

router.beforeEach((to) => {
  const needsAuth = to.matched.some((record) => record.meta.requiresAuth)
  if (needsAuth && !authStore.user) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if ((to.name === 'login' || to.name === 'register') && authStore.user) {
    return { path: '/account' }
  }
  return true
})

router.afterEach((to, from) => {
  // Scroll positions are only relevant to the page they belong to. Keeping
  // them in session storage also means closing the browser clears them.
  if (from.fullPath && from.fullPath !== to.fullPath) {
    sessionStorage.setItem(`mk_scroll:${from.fullPath}`, String(window.scrollY))
  }
})

export default router
