import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard') @UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboard:DashboardService){}
  @Get() state(@Req() req:AuthenticatedRequest){return this.dashboard.state(req.user!);}
  @Post('profile') profile(@Req() req:AuthenticatedRequest,@Body() data:Record<string,unknown>){return this.dashboard.upsertProfile(req.user!,data);}
  @Post(':resource') create(@Param('resource') r:string,@Req() req:AuthenticatedRequest,@Body() data:Record<string,unknown>){return this.dashboard.create(r,req.user!,data);}
  @Patch(':resource/:id') update(@Param('resource') r:string,@Param('id') id:string,@Req() req:AuthenticatedRequest,@Body() data:Record<string,unknown>){return this.dashboard.update(r,id,req.user!,data);}
  @Delete(':resource/:id') remove(@Param('resource') r:string,@Param('id') id:string,@Req() req:AuthenticatedRequest){return this.dashboard.remove(r,id,req.user!);}
  @Get('delivery/quote') quote(@Query('city') city=''){return this.dashboard.deliveryQuote(city);}
}
