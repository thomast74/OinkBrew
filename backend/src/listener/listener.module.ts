import { Module } from '@nestjs/common';

import { CommonModule } from '../common/common.module';
import { ConfigurationsModule } from '../configurations/configurations.module';
import { DevicesModule } from '../devices/devices.module';
import { ParticleEventListener } from './particle-event.listener';

@Module({
  imports: [CommonModule, DevicesModule, ConfigurationsModule],
  providers: [ParticleEventListener],
  exports: [ParticleEventListener],
})
export class ListenerModule {}
