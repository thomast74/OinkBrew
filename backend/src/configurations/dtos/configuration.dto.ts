import { ConnectedDevice, Device } from '../../devices/schemas';
import { ConfigurationType } from '../types';

export class ConfigurationDto {
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
}
