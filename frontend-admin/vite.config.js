import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
export default defineConfig({
  plugins:[vue()],
  publicDir:resolve(__dirname,'./public'),
  resolve:{alias:{
    '@store':resolve(__dirname,'../frontend/src'),
    // Shared @store code (e.g. layouts/AdminLayout.vue) imports 'vue'/'vue-router'
    // itself, and Node resolution from that file's location would otherwise find
    // frontend/node_modules' copies — separate module instances from the ones
    // this app actually installs the router into. useRoute()/useRouter() inject
    // by exact module identity, so two copies means components using the shared
    // code silently get `undefined` back and crash. Force one shared copy.
    'vue':resolve(__dirname,'node_modules/vue'),
    'vue-router':resolve(__dirname,'node_modules/vue-router'),
  }},
  server:{port:9100,host:'0.0.0.0',fs:{allow:[resolve(__dirname,'..')]},proxy:{'/api':{target:process.env.VITE_API_PROXY_TARGET??'http://localhost:9200',changeOrigin:true}}}
})
