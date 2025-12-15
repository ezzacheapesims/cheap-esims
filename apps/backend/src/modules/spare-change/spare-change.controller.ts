import {
  Controller,
  Get,
  Query,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { SpareChangeService } from './spare-change.service';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Controller('spare-change')
export class SpareChangeController {
  constructor(
    private readonly spareChangeService: SpareChangeService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Get Spare Change balance for current user
   */
  @Get()
  async getBalance(@Req() req: any) {
    const email = req.headers['x-user-email'] as string;
    if (!email) {
      throw new NotFoundException('User email not found');
    }

    // Auto-create user if they don't exist (e.g., just signed up via Clerk)
    const user = await this.prisma.user.upsert({
      where: { email },
      create: {
        id: crypto.randomUUID(),
        email,
        name: null,
      },
      update: {},
    });

    const balanceCents = await this.spareChangeService.getBalance(user.id);
    const defaultCurrency = this.config.get<string>('DEFAULT_CURRENCY') || 'USD';

    return {
      balanceCents,
      currency: defaultCurrency,
    };
  }

  /**
   * Get Spare Change transactions for current user
   */
  @Get('transactions')
  async getTransactions(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '50',
  ) {
    const email = req.headers['x-user-email'] as string;
    if (!email) {
      throw new NotFoundException('User email not found');
    }

    // Auto-create user if they don't exist (e.g., just signed up via Clerk)
    const user = await this.prisma.user.upsert({
      where: { email },
      create: {
        id: crypto.randomUUID(),
        email,
        name: null,
      },
      update: {},
    });

    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 50;

    return this.spareChangeService.getTransactions(user.id, pageNum, pageSizeNum);
  }
}


