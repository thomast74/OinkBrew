import { ConnectedDevice } from '../../devices/schemas';
import { ConfigurationDto } from './configuration.dto';

export class FridgeConfigurationDto extends ConfigurationDto {
  coolActuator: ConnectedDevice;
  fanActuator?: ConnectedDevice;
  fanPwm?: number;
  coolingPeriod: number;
  coolingOnTime: number;
  coolingOffTime: number;
}
