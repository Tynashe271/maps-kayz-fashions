import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccount } from '../database/entities/user-account.entity';
import { Customer } from '../database/entities/customer.entity';
import { PlatformRecord } from '../database/entities/platform-record.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { StaffGuard } from './staff.guard';

@Module({
  imports: [TypeOrmModule.forFeature([UserAccount, Customer, PlatformRecord])],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, StaffGuard],
  exports: [AuthService, JwtAuthGuard, StaffGuard],
})
export class AuthModule {}
