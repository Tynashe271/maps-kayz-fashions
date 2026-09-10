import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles.css'
import { startLiveSync } from './lib/liveSync'

const scrollKey = () => `mk_scroll:${window.location.pathname}${window.location.search}`

// Vue Router keeps the current URL on refresh. Store the position as well so
// reloading a long shop or dashboard panel returns the customer to the exact
// place they were viewing.
window.addEventListener('beforeunload', () => {
  sessionStorage.setItem(scrollKey(), String(window.scrollY))
})

const app = createApp(App)
startLiveSync()
app.use(router)

router.isReady().then(() => {
  app.mount('#app')
  const savedPosition = Number(sessionStorage.getItem(scrollKey()))
  if (Number.isFinite(savedPosition) && savedPosition > 0) {
    requestAnimationFrame(() => window.scrollTo({ top: savedPosition, behavior: 'instant' }))
  }
})
