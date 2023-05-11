import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ModelDefinition, MongooseModule } from '@nestjs/mongoose';

import { CommonModule } from '../common/common.module';
import { DevicesEventListener } from './devices-event.listener';
import { DevicesController } from './devices.controller';
import { DevicesProcessor } from './devices.processor';
import { DevicesService } from './devices.service';
import { Device, DeviceSchema } from './schemas';

const modelDefinition: ModelDefinition[] = [
  { name: Device.name, schema: DeviceSchema },
];

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'devices',
    }),
    CommonModule,
    MongooseModule.forFeature(modelDefinition),
  ],
  exports: [MongooseModule.forFeature(modelDefinition), DevicesService],
  controllers: [DevicesController],
  providers: [DevicesService, DevicesProcessor, DevicesEventListener],
})
export class DevicesModule {}
