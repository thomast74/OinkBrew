import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

import { Configuration } from '../../configurations/schemas';
import { ConnectedDevice } from './connected-device.schema';

export type DeviceDocument = HydratedDocument<Device>;

@Schema()
export class Device {
  @Prop()
  id: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop()
  name?: string;

  @Prop()
  last_ip_address: string;

  @Prop()
  last_heard: Date;

  @Prop()
  last_handshake_at: Date;

  @Prop()
  product_id: number;

  @Prop()
  online: boolean;

  @Prop()
  connected: boolean;

  @Prop()
  platform_id: number;

  @Prop()
  cellular: boolean;

  @Prop()
  notes?: string;

  @Prop()
  firmware_updates_enabled: boolean;

  @Prop()
  firmware_updates_forced: boolean;

  @Prop()
  status: string;

  @Prop()
  serial_number: string;

  @Prop()
  system_firmware_version: string;

  @Prop()
  current_build_target: string;

  @Prop()
  pinned_build_target?: string;

  @Prop()
  default_build_target: string;

  @Prop()
  functions: string[];

  @Prop({ type: Map, of: String })
  variables: { [name: string]: string };

  @Prop()
  shieldVersion?: number;

  @Prop()
  firmwareVersion?: number;

  @Prop()
  connectedDevices: ConnectedDevice[];

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Configuration' }],
  })
  configuration: Configuration[];
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

DeviceSchema.set('toObject', {
  virtuals: true,
});

DeviceSchema.set('toJSON', {
  virtuals: true,
});

DeviceSchema.pre<Device>('findOneAndUpdate', function (next) {
  if (!this.createdAt) {
    this.createdAt = new Date();
  }
  this.updatedAt = new Date();

  next();
});
