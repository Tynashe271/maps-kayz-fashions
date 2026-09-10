import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import '@store/styles.css'
import { startLiveSync } from '@store/lib/liveSync'
startLiveSync()
createApp(App).use(router).mount('#app')
