import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { ConfigurationDto, ConnectedDeviceDto } from './configuration.dto';

export class BrewConfigurationDto extends ConfigurationDto {
  @ValidateNested()
  @IsOptional()
  @Type(() => ConnectedDeviceDto)
  pump1Actuator?: ConnectedDeviceDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => ConnectedDeviceDto)
  pump2Actuator?: ConnectedDeviceDto;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @IsOptional()
  heaterPwm: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @IsOptional()
  pump1Pwm?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @IsOptional()
  pump2Pwm?: number;
}
