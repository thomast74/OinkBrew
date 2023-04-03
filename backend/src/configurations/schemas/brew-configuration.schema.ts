import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { ConnectedDevice, Device } from '../../devices/schemas';
import { ConfigurationType } from '../types';

@Schema()
export class BrewConfiguration {
  type: ConfigurationType;
  id: number;
  createdAt: Date;
  updatedAt: Date;
  device: Device;
  name: string;
  temperature: number;
  heatActuator: ConnectedDevice;
  tempSensor: ConnectedDevice;
  heatingPeriod: number;
  p: number;
  i: number;
  d: number;
  archived: boolean;

  @Prop()
  pump1Actuator?: ConnectedDevice;

  @Prop()
  pump2Actuator?: ConnectedDevice;

  @Prop({ default: 0.0 })
  heaterPwm: number;

  @Prop({ default: 0.0 })
  pump1Pwm: number;

  @Prop({ default: 0.0 })
  pump2Pwm: number;
}

export const BrewConfigurationSchema =
  SchemaFactory.createForClass(BrewConfiguration);
