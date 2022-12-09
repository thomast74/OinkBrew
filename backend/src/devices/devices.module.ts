import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DevicesController } from './devices.controller';
import { DevicesProcessor } from './devices.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'devices',
    }),
    CommonModule,
    PrismaModule,
  ],
  controllers: [DevicesController],
  providers: [DevicesProcessor],
})
export class DevicesModule {}
