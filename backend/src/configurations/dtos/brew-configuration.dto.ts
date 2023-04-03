import { ConnectedDevice } from '../../devices/schemas';
import { ConfigurationDto } from './configuration.dto';

export class BrewConfigurationDto extends ConfigurationDto {
  pump1Actuator?: ConnectedDevice;
  pump2Actuator?: ConnectedDevice;
  heaterPwm: number;
  pump1Pwm: number;
  pump2Pwm: number;
}
