import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UserAccount, UserRole } from '../database/entities/user-account.entity';
import { Customer } from '../database/entities/customer.entity';
import { PlatformRecord } from '../database/entities/platform-record.entity';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserAccount) private readonly users: Repository<UserAccount>,
    @InjectRepository(Customer) private readonly customers: Repository<Customer>,
    @InjectRepository(PlatformRecord) private readonly records: Repository<PlatformRecord>,
    private readonly config: ConfigService,
  ) {}

  private hash(password: string, salt = randomBytes(16).toString('hex')) {
    return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
  }

  private matches(password: string, stored: string) {
    const [salt, hash] = stored.split(':');
    const expected = Buffer.from(hash, 'hex');
    const actual = scryptSync(password, salt, 64);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  async register(dto: RegisterDto) {
    const existing = await this.users.findOneBy({ email: dto.email.toLowerCase() });
    if (existing) throw new ConflictException('An account with this email already exists');
    const user = await this.users.save(this.users.create({
      email: dto.email.toLowerCase(),
      passwordHash: this.hash(dto.password),
      // Public registration must never be able to create a privileged staff account.
      role: UserRole.Customer,
    }));
    await this.ensureCustomerProfile(user);
    if (dto.referralCode) await this.applyReferral(dto.referralCode, user);
    return this.publicUser(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOneBy({ email: dto.email.toLowerCase() });
    if (!user || !user.active || !this.matches(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const publicUser = this.publicUser(user);
    const profile = await this.ensureCustomerProfile(user);
    return {
      user: publicUser,
      profile,
      authenticated: true,
      accessToken: this.createToken(publicUser),
    };
  }

  private async ensureCustomerProfile(user: UserAccount) {
    if (user.role !== UserRole.Customer) return null;
    let customer = await this.customers.findOneBy({ email: user.email });
    if (customer) return customer;
    const name = user.email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
    customer = await this.customers.save(this.customers.create({ name, email: user.email, phone: null, loyaltyPoints: 0 }));
    return customer;
  }

  private async applyReferral(code: string, newUser: UserAccount) {
    const codes = await this.records.find({ where: { resource: 'affiliate-codes', active: true } });
    const referral = codes.find(record => String(record.data?.code) === code);
    if (!referral || referral.data?.userId === newUser.id) return;
    const referrer = await this.users.findOneBy({ id: String(referral.data.userId) });
    if (!referrer) return;
    const customer = await this.customers.findOneBy({ email: referrer.email });
    if (customer) await this.customers.save({ ...customer, loyaltyPoints: customer.loyaltyPoints + 250 });
    await this.records.save(this.records.create({
      resource: 'loyalty-transactions', reference: `${referrer.id}:referral:${newUser.id}`,
      data: { userId: referrer.id, email: referrer.email, referredUserId: newUser.id, referredEmail: newUser.email, points: 250, type: 'Referral reward' }, active: true,
    }));
    referral.data = { ...referral.data, successfulReferrals: Number(referral.data.successfulReferrals || 0) + 1 };
    await this.records.save(referral);
  }

  private createToken(user: { id: string; email: string; role: UserRole }) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const issuedAt = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(JSON.stringify({ ...user, iat: issuedAt, exp: issuedAt + 3600 })).toString('base64url');
    const content = `${header}.${payload}`;
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET must be configured');
    const signature = createHmac('sha256', secret).update(content).digest('base64url');
    return `${content}.${signature}`;
  }

  private publicUser(user: UserAccount) {
    return { id: user.id, email: user.email, role: user.role, active: user.active };
  }
}
