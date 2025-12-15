import { Module } from '@nestjs/common';
import { SpareChangeController } from './spare-change.controller';
import { SpareChangeService } from './spare-change.service';
import { PrismaService } from '../../prisma.service';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../../common/modules/common.module';

@Module({
  imports: [ConfigModule, CommonModule],
  controllers: [SpareChangeController],
  providers: [SpareChangeService, PrismaService],
  exports: [SpareChangeService],
})
export class SpareChangeModule {}


