import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { ConnectedDevice, Device } from '../../devices/schemas';
import { ConfigurationType } from '../types';
import { SensorData } from './sensor-data.schema';

@Schema()
export class FridgeConfiguration {
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

  @Prop({ required: true })
  coolActuator: ConnectedDevice;

  @Prop()
  fanActuator?: ConnectedDevice;

  @Prop({ default: 0.0 })
  fanPwm: number;

  @Prop({ required: true })
  coolingPeriod: number;

  @Prop({ required: true })
  coolingOnTime: number;

  @Prop({ required: true })
  coolingOffTime: number;
}

export const FridgeConfigurationSchema = SchemaFactory.createForClass(FridgeConfiguration);

FridgeConfigurationSchema.methods.hasConnectedDevice = function (
  pinNr: number,
  hwAddress: string,
): boolean {
  if (
    (this.heatActuator.pinNr === pinNr && this.heatActuator.hwAddress === hwAddress) ||
    (this.tempSensor.pinNr === pinNr && this.tempSensor.hwAddress === hwAddress) ||
    (this.coolActuator.pinNr === pinNr && this.coolActuator.hwAddress === hwAddress) ||
    (this.fanActuator?.pinNr === pinNr && this.fanActuator?.hwAddress === hwAddress)
  ) {
    return true;
  }

  return false;
};
