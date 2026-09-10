import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
export default defineConfig({
  plugins:[vue()],
  publicDir:resolve(__dirname,'./public'),
  resolve:{alias:{'@store':resolve(__dirname,'../frontend/src')}},
  server:{port:9100,host:'0.0.0.0',fs:{allow:[resolve(__dirname,'..')]},proxy:{'/api':{target:process.env.VITE_API_PROXY_TARGET??'http://localhost:9200',changeOrigin:true}}}
})
