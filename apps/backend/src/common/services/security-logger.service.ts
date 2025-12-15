import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as crypto from 'crypto';

export type SecurityEventType =
  | 'RATE_LIMIT'
  | 'INVALID_WEBHOOK'
  | 'INVALID_CSRF'
  | 'UNAUTHORIZED_ACCESS'
  | 'ADMIN_ACTION'
  | 'TOKEN_CREATE'
  | 'TOKEN_REVOKE'
  | 'OWNERSHIP_VIOLATION'
  | 'BRUTE_FORCE_ATTEMPT'
  | 'INVALID_IP'
  | 'AFFILIATE_PAYOUT_CHANGE'
  | 'SPARE_CHANGE_CREDIT'
  | 'SPARE_CHANGE_DEBIT'
  | 'ORDER_REFUND_SPARE_CHANGE'
  | 'AFFILIATE_COMMISSION_TO_SPARE_CHANGE'
  | 'SPARE_CHANGE_ADMIN_ADJUST'
  | 'SPARE_CHANGE_ADMIN_CREDIT'
  | 'AFFILIATE_FRAUD_EVENT'
  | 'AFFILIATE_FROZEN'
  | 'AFFILIATE_UNFROZEN';

interface LogSecurityEventParams {
  type: SecurityEventType;
  ip?: string;
  userId?: string;
  details?: any;
}

@Injectable()
export class SecurityLoggerService {
  private readonly logger = new Logger(SecurityLoggerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logSecurityEvent(params: LogSecurityEventParams): Promise<void> {
    try {
      await this.prisma.securityEventLog.create({
        data: {
          id: crypto.randomUUID(),
          type: params.type,
          ip: params.ip || null,
          userId: params.userId || null,
          details: params.details || {},
        },
      });
    } catch (error) {
      this.logger.error('Failed to log security event:', error);
    }
  }
}

