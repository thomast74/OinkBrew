import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

import { ConnectedDevice, Device } from '../../devices/schemas';
import { ConfigurationType } from '../types';
import { SensorData } from './sensor-data.schema';

export type ConfigurationDocument = HydratedDocument<Configuration>;

@Schema({ discriminatorKey: 'type' })
export class Configuration {
  @Prop({
    required: true,
    type: Number,
    enum: [ConfigurationType.BREW, ConfigurationType.FRIDGE],
  })
  type: ConfigurationType;

  @Prop({ required: true, unique: true })
  id: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: Device.name,
  })
  device: Device;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  temperature: number;

  @Prop({ required: true })
  heatActuator: ConnectedDevice;

  @Prop({ required: true })
  tempSensor: ConnectedDevice;

  @Prop({ required: true })
  heatingPeriod: number;

  @Prop({ required: true })
  p: number;

  @Prop({ required: true })
  i: number;

  @Prop({ required: true })
  d: number;

  @Prop({ required: true, default: false })
  archived: boolean;

  @Prop({ type: MongooseSchema.Types.Map, of: [{ name: String, value: Number }] })
  sensorData: Map<string, SensorData[]>;
}

export const ConfigurationSchema = SchemaFactory.createForClass(Configuration);

ConfigurationSchema.methods.hasConnectedDevice = function (
  pinNr: number,
  hwAddress: string,
): boolean {
  if (
    (this.heatActuator.pinNr === pinNr && this.heatActuator.hwAddress === hwAddress) ||
    (this.tempSensor.pinNr === pinNr && this.tempSensor.hwAddress === hwAddress)
  ) {
    return true;
  }

  return false;
};

ConfigurationSchema.pre('save', function (next) {
  if (this.isNew) {
    this.createdAt = new Date();
  }
  this.updatedAt = new Date();
  next();
});
