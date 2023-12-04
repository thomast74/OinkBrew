import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { ConnectedDevice, Device } from '../../devices/schemas';
import { ConfigurationType } from '../types';
import { SensorData } from './sensor-data.schema';

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
  sensorData: Map<string, SensorData[]>;
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

export const BrewConfigurationSchema = SchemaFactory.createForClass(BrewConfiguration);

BrewConfigurationSchema.methods.hasConnectedDevice = function (
  pinNr: number,
  hwAddress: string,
): boolean {
  if (
    (this.heatActuator.pinNr === pinNr && this.heatActuator.hwAddress === hwAddress) ||
    (this.tempSensor.pinNr === pinNr && this.tempSensor.hwAddress === hwAddress) ||
    (this.pump1Actuator?.pinNr === pinNr && this.pump1Actuator?.hwAddress === hwAddress) ||
    (this.pump2Actuator?.pinNr === pinNr && this.pump2Actuator?.hwAddress === hwAddress)
  ) {
    return true;
  }

  return false;
};
