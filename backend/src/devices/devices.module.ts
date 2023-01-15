import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DevicesEventListener } from './devices-event.listener';
import { DevicesController } from './devices.controller';
import { DevicesProcessor } from './devices.processor';
import { DevicesService } from './devices.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'devices',
    }),
    CommonModule,
    PrismaModule,
  ],
  controllers: [DevicesController],
  providers: [DevicesService, DevicesProcessor, DevicesEventListener],
})
export class DevicesModule {}
