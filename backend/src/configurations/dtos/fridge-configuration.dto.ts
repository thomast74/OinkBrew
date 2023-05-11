import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { ConnectedDevice } from '../../devices/schemas';
import { ConfigurationDto, ConnectedDeviceDto } from './configuration.dto';

export class FridgeConfigurationDto extends ConfigurationDto {
  @ValidateNested()
  @Type(() => ConnectedDeviceDto)
  coolActuator: ConnectedDeviceDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => ConnectedDeviceDto)
  fanActuator?: ConnectedDevice;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @IsOptional()
  fanPwm?: number;

  @IsInt()
  @Min(0)
  coolingPeriod: number;

  @IsInt()
  @Min(0)
  coolingOnTime: number;

  @IsInt()
  @Min(0)
  coolingOffTime: number;
}
