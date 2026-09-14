import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../database/entities/product.entity';
import { Order, OrderStatus } from '../database/entities/order.entity';
import { Customer } from '../database/entities/customer.entity';
import { Delivery } from '../database/entities/delivery.entity';
import { ReturnRequest } from '../database/entities/return-request.entity';
import { PlatformRecord } from '../database/entities/platform-record.entity';
import { InventoryItem } from '../database/entities/inventory-item.entity';
import { StockMovement, StockMovementType } from '../database/entities/stock-movement.entity';
@Injectable()
export class AdminService {
  constructor(@InjectRepository(Product) private products:Repository<Product>,@InjectRepository(Order) private orders:Repository<Order>,@InjectRepository(Customer) private customers:Repository<Customer>,@InjectRepository(Delivery) private deliveries:Repository<Delivery>,@InjectRepository(ReturnRequest) private returns:Repository<ReturnRequest>,@InjectRepository(PlatformRecord) private records:Repository<PlatformRecord>,@InjectRepository(InventoryItem) private inventory:Repository<InventoryItem>,@InjectRepository(StockMovement) private movements:Repository<StockMovement>){}
  async getDashboard(){
    const [products,orders,customers,deliveries,returns,records,inventory,movements]=await Promise.all([this.products.find(),this.orders.find({order:{createdAt:'DESC'}}),this.customers.count(),this.deliveries.count(),this.returns.count(),this.records.find(),this.inventory.find(),this.movements.find()]);
    const now=new Date(),month=new Date(now.getFullYear(),now.getMonth(),1),day=new Date(now.getFullYear(),now.getMonth(),now.getDate()),thirtyDaysAgo=new Date(now.getTime()-30*86400000);
    const completed=orders.filter(o=>![OrderStatus.Cancelled,OrderStatus.Refunded].includes(o.status));
    const sum=(items:Order[])=>items.reduce((n,o)=>n+Number(o.total),0);
    const inventoryByProduct=new Map<string,number>();
    for(const item of inventory) inventoryByProduct.set(item.productId,(inventoryByProduct.get(item.productId)||0)+item.available);
    const stockFor=(p:Product)=>inventoryByProduct.has(p.id)?inventoryByProduct.get(p.id)!:p.stock;
    const soldByProduct=new Map<string,number>(),sold30ByProduct=new Map<string,number>(),revenue30ByProduct=new Map<string,number>();
    for(const order of completed) for(const item of order.items||[]){soldByProduct.set(item.productId,(soldByProduct.get(item.productId)||0)+item.quantity);if(new Date(order.createdAt)>=thirtyDaysAgo){sold30ByProduct.set(item.productId,(sold30ByProduct.get(item.productId)||0)+item.quantity);revenue30ByProduct.set(item.productId,(revenue30ByProduct.get(item.productId)||0)+Number(item.total))}}
    const productById=new Map(products.map(p=>[p.id,p]));
    const topProducts=[...revenue30ByProduct.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([productId,revenue])=>{const p=productById.get(productId);return{id:productId,name:p?.name??'Deleted product',sku:p?.sku??productId,unitsSold30:sold30ByProduct.get(productId)||0,revenue30:revenue}});
    const fourteenDaysAgo=new Date(now.getTime()-13*86400000);
    const revenueByDay=new Map<string,number>();
    for(const order of completed){const created=new Date(order.createdAt);if(created<fourteenDaysAgo)continue;const key=created.toISOString().slice(0,10);revenueByDay.set(key,(revenueByDay.get(key)||0)+Number(order.total))}
    const revenueTrend=Array.from({length:14},(_,i)=>{const d=new Date(fourteenDaysAgo.getTime()+i*86400000);const key=d.toISOString().slice(0,10);return{date:key,revenue:Number((revenueByDay.get(key)||0).toFixed(2))}});
    const recentLowStockAlerts=records.filter(r=>r.resource==='restock-alerts').sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).slice(0,10).map(r=>r.data);
    const unitsSold=[...soldByProduct.values()].reduce((a,b)=>a+b,0);
    const unitsPurchased=movements.filter(m=>m.type===StockMovementType.Receipt).reduce((n,m)=>n+Math.max(0,m.quantity),0);
    const unitsRemaining=products.reduce((n,p)=>n+stockFor(p),0);
    const inventoryRetailValue=products.reduce((n,p)=>n+stockFor(p)*Number(p.price),0);
    const forecast=products.filter(p=>p.isActive).map(p=>{const stock=stockFor(p),sold30=sold30ByProduct.get(p.id)||0,dailyRate=sold30/30;const daysRemaining=dailyRate>0?Math.max(0,Math.ceil(stock/dailyRate)):null;const predictedOutDate=daysRemaining===null?null:new Date(now.getTime()+daysRemaining*86400000).toISOString();const reorderLevel=inventory.filter(i=>i.productId===p.id).reduce((n,i)=>n+i.reorderLevel,0)||5;return{id:p.id,name:p.name,sku:p.sku,stock,sold30,dailyRate:Number(dailyRate.toFixed(2)),daysRemaining,predictedOutDate,reorderLevel,recommendedOrder:Math.max(0,Math.ceil(sold30+reorderLevel-stock)),status:stock<=reorderLevel?'restock-now':daysRemaining!==null&&daysRemaining<=14?'running-low':'healthy'}}).sort((a,b)=>(a.daysRemaining??999999)-(b.daysRemaining??999999)).slice(0,10);
    return{todaysSales:sum(completed.filter(o=>new Date(o.createdAt)>=day)),monthlyRevenue:sum(completed.filter(o=>new Date(o.createdAt)>=month)),ordersWaiting:orders.filter(o=>![OrderStatus.Delivered,OrderStatus.Cancelled,OrderStatus.Returned,OrderStatus.Refunded].includes(o.status)).length,lowStockProducts:products.filter(p=>p.isActive&&stockFor(p)<=5).length,returningCustomers:customers,totalProducts:products.length,activeProducts:products.filter(p=>p.isActive).length,deliveries,returns,openTickets:records.filter(r=>r.resource==='support-tickets'&&r.data?.status!=='Closed').length,pendingReviews:records.filter(r=>r.resource==='reviews'&&r.data?.status==='Pending').length,openQuestions:records.filter(r=>r.resource==='product-questions'&&r.data?.status!=='Answered').length,recentOrders:orders.slice(0,5).map(o=>({id:o.id,orderNumber:o.orderNumber,status:o.status,total:Number(o.total),createdAt:o.createdAt})),lowStock:products.filter(p=>p.isActive&&stockFor(p)<=5).slice(0,5).map(p=>({id:p.id,name:p.name,sku:p.sku,stock:stockFor(p)})),inventoryAnalysis:{unitsSold,unitsPurchased,unitsRemaining,totalSalesRevenue:sum(completed),inventoryRetailValue,netStockFlow:unitsPurchased-unitsSold},stockForecast:forecast,topProducts,revenueTrend,recentLowStockAlerts}
  }
}
