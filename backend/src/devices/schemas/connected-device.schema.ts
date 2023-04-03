import { Prop } from '@nestjs/mongoose';

import { ConnectedDeviceType } from '../types';

export class ConnectedDevice {
  @Prop({
    required: true,
    type: Number,
    enum: Object.values(ConnectedDeviceType),
  })
  type: ConnectedDeviceType;

  @Prop()
  pinNr: number;

  @Prop()
  hwAddress: string;

  @Prop({ default: false })
  connected?: boolean;

  @Prop()
  name?: string;

  @Prop({ default: 0.0 })
  offset?: number;

  @Prop({ default: 0.0 })
  deviceOffset?: number;
}
