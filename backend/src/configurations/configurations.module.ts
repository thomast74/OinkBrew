import { Module } from '@nestjs/common';
import { ModelDefinition, MongooseModule } from '@nestjs/mongoose';

import { CommonModule } from '../common/common.module';
import { DevicesModule } from '../devices/devices.module';
import { ConfigurationsController } from './configurations.controller';
import { ConfigurationsService } from './configurations.service';
import {
  BrewConfiguration,
  BrewConfigurationSchema,
  Configuration,
  ConfigurationSchema,
  FridgeConfiguration,
  FridgeConfigurationSchema,
} from './schemas';

const modelDefinition: ModelDefinition[] = [
  {
    name: Configuration.name,
    schema: ConfigurationSchema,
    discriminators: [
      {
        name: BrewConfiguration.name,
        schema: BrewConfigurationSchema,
      },
      {
        name: FridgeConfiguration.name,
        schema: FridgeConfigurationSchema,
      },
    ],
  },
];

@Module({
  imports: [
    CommonModule,
    MongooseModule.forFeature(modelDefinition),
    DevicesModule,
  ],
  exports: [MongooseModule.forFeature(modelDefinition)],
  controllers: [ConfigurationsController],
  providers: [ConfigurationsService],
})
export class ConfigurationsModule {}
