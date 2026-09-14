import { createRouter,createWebHistory } from 'vue-router'
import { authStore,isStaff } from '@store/lib/auth'
const AdminLayout=()=>import('@store/layouts/AdminLayout.vue')
const routes=[
  {path:'/login',name:'admin-login',component:()=>import('./AdminLogin.vue')},
  {path:'/',component:AdminLayout,meta:{staff:true},children:[
    {path:'',name:'admin-dashboard',component:()=>import('@store/pages/admin/DashboardPage.vue')},
    {path:'products',name:'admin-products',component:()=>import('@store/pages/admin/ProductsPage.vue')},
    {path:'categories',name:'admin-categories',component:()=>import('@store/pages/admin/CategoriesPage.vue')},
    {path:'customers',name:'admin-customers',component:()=>import('@store/pages/admin/CustomersPage.vue')},
    {path:'orders',name:'admin-orders',component:()=>import('@store/pages/admin/OrdersPage.vue')},
    {path:'promotions',name:'admin-promotions',component:()=>import('@store/pages/admin/PromotionsPage.vue')},
    {path:'inventory',name:'admin-inventory',component:()=>import('@store/pages/admin/InventoryPage.vue')},
    {path:'suppliers',name:'admin-suppliers',component:()=>import('@store/pages/admin/SuppliersPage.vue')},
    {path:'deliveries',name:'admin-deliveries',component:()=>import('@store/pages/admin/DeliveriesPage.vue')},
    {path:'returns',name:'admin-returns',component:()=>import('@store/pages/admin/ReturnsPage.vue')},
    {path:'platform',name:'admin-platform',component:()=>import('@store/pages/admin/PlatformPage.vue')}
  ]}
]
const router=createRouter({history:createWebHistory(),routes})
router.beforeEach(to=>{if(to.meta.staff&&(!authStore.user||!isStaff.value))return'/login';if(to.name==='admin-login'&&isStaff.value)return'/';return true})
export default router
