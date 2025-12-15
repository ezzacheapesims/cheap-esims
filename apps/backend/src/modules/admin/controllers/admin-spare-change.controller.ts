import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { SpareChangeService } from '../../spare-change/spare-change.service';
import { PrismaService } from '../../../prisma.service';
import { SecurityLoggerService } from '../../../common/services/security-logger.service';
import { getClientIp } from '../../../common/utils/webhook-ip-whitelist';

@Controller('admin/spare-change')
@UseGuards(AdminGuard)
export class AdminSpareChangeController {
  constructor(
    private readonly spareChangeService: SpareChangeService,
    private readonly prisma: PrismaService,
    private readonly securityLogger: SecurityLoggerService,
  ) {}

  /**
   * Get Spare Change balance and transactions for a user
   */
  @Get(':userId')
  async getUserSpareChange(
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const balanceCents = await this.spareChangeService.getBalance(userId);
    const transactions = await this.spareChangeService.getTransactions(userId, 1, 50);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      balanceCents,
      transactions: transactions.transactions,
    };
  }

  /**
   * Admin adjustment to Spare Change balance
   */
  @Post('adjust')
  async adjustSpareChange(
    @Req() req: any,
    @Body() body: {
      userId: string;
      amountCents: number;
      type: 'credit' | 'debit';
      reason: string;
    },
  ) {
    if (!body.userId || !body.amountCents || !body.type || !body.reason) {
      throw new BadRequestException('All fields are required');
    }

    if (body.amountCents <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: body.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const ip = getClientIp(req);

    if (body.type === 'credit') {
      await this.spareChangeService.credit(
        body.userId,
        body.amountCents,
        'manual_adjustment',
        {
          reason: body.reason,
          adminEmail: req.adminEmail,
        },
        ip,
      );
    } else {
      await this.spareChangeService.debit(
        body.userId,
        body.amountCents,
        'manual_adjustment',
        {
          reason: body.reason,
          adminEmail: req.adminEmail,
        },
        ip,
      );
    }

    // Log security event
    await this.securityLogger.logSecurityEvent({
      type: 'VCASH_ADMIN_ADJUST' as any,
      userId: body.userId,
      ip,
      details: {
        adminEmail: req.adminEmail,
        type: body.type,
        amountCents: body.amountCents,
        reason: body.reason,
      },
    });

    const newBalance = await this.spareChangeService.getBalance(body.userId);

    return {
      success: true,
      message: `Spare Change ${body.type === 'credit' ? 'credited' : 'debited'} successfully`,
      newBalanceCents: newBalance,
    };
  }

  /**
   * Admin credit Spare Change to a user (credit-only endpoint)
   */
  @Post('credit')
  async creditSpareChange(
    @Req() req: any,
    @Body() body: {
      userId: string;
      amountCents: number;
      reason?: string;
    },
  ) {
    if (!body.userId || !body.amountCents) {
      throw new BadRequestException('userId and amountCents are required');
    }

    if (body.amountCents <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: body.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const ip = getClientIp(req);
    const reason = body.reason || 'admin_manual_credit';

    await this.spareChangeService.credit(
      body.userId,
      body.amountCents,
      'admin_manual_credit',
      {
        reason,
        adminEmail: req.adminEmail,
      },
      ip,
    );

    // Log security event
    await this.securityLogger.logSecurityEvent({
      type: 'VCASH_ADMIN_CREDIT' as any,
      userId: body.userId,
      ip,
      details: {
        adminEmail: req.adminEmail,
        amountCents: body.amountCents,
        reason,
      },
    });

    const newBalance = await this.spareChangeService.getBalance(body.userId);

    return {
      success: true,
      newBalance,
    };
  }
}


