import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformRecord } from '../database/entities/platform-record.entity';
import { Customer } from '../database/entities/customer.entity';
import { Order } from '../database/entities/order.entity';
import { SyncService } from '../sync/sync.service';

export const CUSTOMER_RESOURCES = ['addresses','wishlists','saved-items','search-history','saved-outfits','styling-profiles','measurement-profiles','notification-preferences','notifications','support-tickets','support-messages','reviews','product-questions','affiliate-codes','loyalty-transactions','consent-records','device-sessions','customer-data-requests','account-deletion-requests','user-profiles'] as const;

@Injectable()
export class DashboardService {
  constructor(@InjectRepository(PlatformRecord) private records: Repository<PlatformRecord>, @InjectRepository(Customer) private customers: Repository<Customer>, @InjectRepository(Order) private orders: Repository<Order>, private sync: SyncService) {}
  private valid(resource:string){ if(!CUSTOMER_RESOURCES.includes(resource as any)) throw new BadRequestException('Unsupported dashboard resource'); }
  async state(user:{id:string,email:string}){
    const all=await this.records.find({order:{createdAt:'DESC'}});
    const resources=Object.fromEntries(CUSTOMER_RESOURCES.map(r=>[r,all.filter(x=>x.resource===r && x.data?.userId===user.id)]));
    const customer=await this.customers.findOneBy({email:user.email});
    const orders=customer?await this.orders.find({where:{customerId:customer.id},relations:{items:true},order:{createdAt:'DESC'}}):[];
    return {profile:resources['user-profiles'][0]||null,customer,orders,resources,delivery:{freeCity:'Bulawayo',outsideFee:8,currency:'USD'}};
  }
  async create(resource:string,user:{id:string,email:string},data:Record<string,unknown>){
    this.valid(resource); const reference=`${user.id}:${resource}:${Date.now()}`;
    const record=await this.records.save(this.records.create({resource,reference,data:{...data,userId:user.id,email:user.email},active:true}));
    this.sync.emit({type:'customer',resource,action:'created',id:record.id});
    if(resource==='user-profiles') await this.syncCustomer(user.email,data);
    if(resource==='support-tickets') await this.createNotification(user,{type:'Support',title:'Support ticket received',body:`${data.subject||'Your request'} has been sent to our team.`});
    if(resource==='reviews') await this.createNotification(user,{type:'Review',title:'Review submitted',body:'Your rating is now pending staff approval.'});
    return record;
  }
  async upsertProfile(user:{id:string,email:string},data:Record<string,unknown>){
    const existing=await this.records.findOne({where:{resource:'user-profiles',reference:`profile:${user.id}`}});
    const payload={...data,userId:user.id,email:user.email};
    const saved=existing?await this.records.save({...existing,data:payload}):await this.records.save(this.records.create({resource:'user-profiles',reference:`profile:${user.id}`,data:payload,active:true}));
    await this.syncCustomer(user.email,data); return saved;
  }
  private async syncCustomer(email:string,data:Record<string,unknown>){
    let customer=await this.customers.findOneBy({email});
    const name=String(data.name||email.split('@')[0]); const phone=data.phone?String(data.phone):null;
    if(customer) await this.customers.save({...customer,name,phone}); else await this.customers.save(this.customers.create({email,name,phone,loyaltyPoints:0}));
  }
  async update(resource:string,id:string,user:{id:string},data:Record<string,unknown>){
    this.valid(resource); const record=await this.records.findOneBy({id,resource}); if(!record)throw new NotFoundException(); if(record.data?.userId!==user.id)throw new ForbiddenException();
    record.data={...record.data,...data}; const saved=await this.records.save(record);this.sync.emit({type:'customer',resource,action:'updated',id});return saved;
  }
  async remove(resource:string,id:string,user:{id:string}){this.valid(resource);const record=await this.records.findOneBy({id,resource});if(!record)throw new NotFoundException();if(record.data?.userId!==user.id)throw new ForbiddenException();await this.records.remove(record);this.sync.emit({type:'customer',resource,action:'deleted',id});return{deleted:true};}
  deliveryQuote(city:string){const inBulawayo=city.trim().toLowerCase()==='bulawayo';return{city,eligibleForFreeDelivery:inBulawayo,fee:inBulawayo?0:8,currency:'USD',message:inBulawayo?'Free delivery in Bulawayo':'Nationwide courier delivery fee applies'};}
  private createNotification(user:{id:string,email:string},data:Record<string,unknown>){return this.records.save(this.records.create({resource:'notifications',reference:`${user.id}:notification:${Date.now()}`,data:{...data,userId:user.id,email:user.email,read:false},active:true}));}
}
