<script setup>
import { computed,onMounted,ref } from 'vue'
import { api } from '../../lib/api'
const loading=ref(true),error=ref(''),stats=ref(null),whatsappConfigured=ref(false)
const greeting=computed(()=>new Date().getHours()<12?'Good morning':new Date().getHours()<18?'Good afternoon':'Good evening')
const money=value=>Number(value||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})
const date=value=>value?new Date(value).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'Not enough sales history'
const cards=[['monthlyRevenue','Monthly revenue','US$'],['ordersWaiting','Orders waiting',''],['activeProducts','Active products',''],['lowStockProducts','Low stock',''],['returningCustomers','Customers','']]
const maxTrendRevenue=computed(()=>Math.max(1,...(stats.value?.revenueTrend||[]).map(d=>d.revenue)))
const trendDay=value=>new Date(value).toLocaleDateString(undefined,{day:'numeric',month:'short'})
onMounted(async()=>{
  try{stats.value=await api.getDashboard()}catch(e){error.value=e.message}finally{loading.value=false}
  api.getWhatsAppStatus().then(s=>{whatsappConfigured.value=s.cloudApiConfigured}).catch(()=>{})
})
</script>
<template>
  <div class="admin-landing-head"><div><p class="eyebrow dark">Operations overview</p><h1>{{greeting}}, Maps Kayz.</h1><p>Live sales, stock balances and inventory forecasts from the database. <span class="status-pill" :class="whatsappConfigured?'tone-success':'tone-muted'" style="margin-left:6px">WhatsApp Cloud API {{whatsappConfigured?'connected':'not configured'}}</span></p></div><router-link class="btn btn-primary" to="/products">+ Add product</router-link></div>
  <p v-if="error" class="alert alert-error">{{error}}</p><div v-if="loading" class="loading-state">Loading live store data…</div>
  <template v-else-if="stats">
    <section class="admin-hero-metric"><div><span>Today's sales</span><strong>US${{money(stats.todaysSales)}}</strong><small>Recorded from valid orders today</small></div><div class="admin-health"><p><span>Products</span><b>{{stats.totalProducts}}</b></p><p><span>Deliveries</span><b>{{stats.deliveries}}</b></p><p><span>Returns</span><b>{{stats.returns}}</b></p></div></section>
    <section class="stat-grid"><article v-for="c in cards" :key="c[0]" class="stat-card"><span>{{c[1]}}</span><strong>{{c[2]}}{{Number(stats[c[0]]||0).toLocaleString()}}</strong></article></section>
    <section class="admin-panel inventory-analysis"><div class="admin-panel-title"><div><p class="eyebrow dark">Inventory analysis</p><h2>Stock movement & balances</h2></div><router-link to="/inventory">Manage inventory →</router-link></div><div class="inventory-kpis"><article><span>Goods sold</span><strong>{{stats.inventoryAnalysis.unitsSold.toLocaleString()}}</strong><small>Units in valid orders</small></article><article><span>Goods bought</span><strong>{{stats.inventoryAnalysis.unitsPurchased.toLocaleString()}}</strong><small>Units recorded as receipts</small></article><article><span>Goods left</span><strong>{{stats.inventoryAnalysis.unitsRemaining.toLocaleString()}}</strong><small>Available across inventory</small></article><article><span>Sales balance</span><strong>US${{money(stats.inventoryAnalysis.totalSalesRevenue)}}</strong><small>Excluding cancelled and refunded</small></article><article><span>Stock value balance</span><strong>US${{money(stats.inventoryAnalysis.inventoryRetailValue)}}</strong><small>Remaining units at selling price</small></article><article><span>Net stock flow</span><strong>{{stats.inventoryAnalysis.netStockFlow>0?'+':''}}{{stats.inventoryAnalysis.netStockFlow.toLocaleString()}}</strong><small>Receipts minus units sold</small></article></div></section>
    <section class="admin-panel forecast-panel"><div class="admin-panel-title"><div><p class="eyebrow dark">Predictor</p><h2>Stock depletion forecast</h2><p>Based on each product's sales rate over the last 30 days.</p></div><router-link to="/inventory">Refill stock →</router-link></div><div v-if="!stats.stockForecast.length" class="admin-empty">Add products and record sales to begin forecasting.</div><div v-else class="forecast-table-wrap"><table class="data-table forecast-table"><thead><tr><th>Product</th><th>Left</th><th>Sold / 30 days</th><th>Daily rate</th><th>Expected to finish</th><th>Action</th></tr></thead><tbody><tr v-for="p in stats.stockForecast" :key="p.id"><td><strong>{{p.name}}</strong><small>{{p.sku}}</small></td><td>{{p.stock}}</td><td>{{p.sold30}}</td><td>{{p.dailyRate}}</td><td><strong>{{date(p.predictedOutDate)}}</strong><small v-if="p.daysRemaining!==null">About {{p.daysRemaining}} days left</small></td><td><span class="status-pill" :class="p.status==='restock-now'?'tone-danger':p.status==='running-low'?'tone-pink':'tone-success'">{{p.status==='restock-now'?'Restock now':p.status==='running-low'?'Running low':'Healthy'}}</span><small v-if="p.recommendedOrder">Buy about {{p.recommendedOrder}} units</small></td></tr></tbody></table></div></section>
    <section class="admin-panel">
      <div class="admin-panel-title"><div><p class="eyebrow dark">Analytics</p><h2>Revenue, last 14 days</h2></div></div>
      <div v-if="!stats.revenueTrend.some(d=>d.revenue)" class="admin-empty">No sales recorded in this period yet.</div>
      <div v-else style="display:flex;align-items:flex-end;gap:4px;height:110px;margin:18px 0 6px">
        <div v-for="d in stats.revenueTrend" :key="d.date" :title="`${trendDay(d.date)}: US$${money(d.revenue)}`" style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%">
          <div :style="{height:Math.max(2,Math.round(d.revenue/maxTrendRevenue*100))+'%',background:'var(--pink)',minHeight:'2px'}"></div>
        </div>
      </div>
      <div v-if="stats.revenueTrend.length" style="display:flex;justify-content:space-between;color:var(--muted);font-size:9px"><span>{{trendDay(stats.revenueTrend[0].date)}}</span><span>{{trendDay(stats.revenueTrend[stats.revenueTrend.length-1].date)}}</span></div>
    </section>
    <div class="admin-landing-grid">
      <section class="admin-panel"><div class="admin-panel-title"><h2>Top products (30 days)</h2><router-link to="/products">Manage products →</router-link></div>
        <div v-if="!stats.topProducts.length" class="admin-empty">No sales in the last 30 days yet.</div>
        <div v-for="p in stats.topProducts" :key="p.id" class="admin-feed-row"><div><strong>{{p.name}}</strong><small>{{p.sku}}</small></div><span>{{p.unitsSold30}} sold</span><b>US${{money(p.revenue30)}}</b></div>
      </section>
      <section class="admin-panel"><div class="admin-panel-title"><h2>Recent stock alerts</h2><router-link to="/inventory">Open inventory →</router-link></div>
        <div v-if="!stats.recentLowStockAlerts.length" class="admin-empty">No low-stock alerts triggered yet.</div>
        <div v-for="(a,i) in stats.recentLowStockAlerts" :key="i" class="admin-feed-row"><div><strong>{{a.productName}}</strong><small>{{a.sku}} · {{new Date(a.triggeredAt).toLocaleDateString()}}</small></div><span>reorder at {{a.reorderLevel}}</span><b>{{a.available}} left</b></div>
      </section>
    </div>
    <section class="admin-attention"><router-link to="/platform"><span>Open support tickets</span><strong>{{stats.openTickets}}</strong><small>Review requests →</small></router-link><router-link to="/platform"><span>Pending reviews</span><strong>{{stats.pendingReviews}}</strong><small>Moderate feedback →</small></router-link><router-link to="/platform"><span>Product questions</span><strong>{{stats.openQuestions}}</strong><small>Reply to customers →</small></router-link></section>
    <div class="admin-landing-grid"><section class="admin-panel"><div class="admin-panel-title"><h2>Recent orders</h2><router-link to="/orders">View all →</router-link></div><div v-if="!stats.recentOrders.length" class="admin-empty">No orders yet.</div><div v-for="o in stats.recentOrders" :key="o.id" class="admin-feed-row"><div><strong>{{o.orderNumber}}</strong><small>{{new Date(o.createdAt).toLocaleDateString()}}</small></div><span>{{o.status}}</span><b>US${{money(o.total)}}</b></div></section><section class="admin-panel"><div class="admin-panel-title"><h2>Stock attention</h2><router-link to="/inventory">Open inventory →</router-link></div><div v-if="!stats.lowStock.length" class="admin-empty">All stocked products are healthy.</div><div v-for="p in stats.lowStock" :key="p.id" class="admin-feed-row"><div><strong>{{p.name}}</strong><small>{{p.sku}}</small></div><b>{{p.stock}} left</b></div></section></div>
  </template>
</template>
