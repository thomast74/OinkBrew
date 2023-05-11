import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { ConnectedDeviceType } from '../../devices/types';
import { ConfigurationType } from '../types';

export class ConnectedDeviceDto {
  @IsEnum(ConnectedDeviceType) type: ConnectedDeviceType;
  @IsInt() pinNr: number;
  @IsString() hwAddress: string;
}

export class ConfigurationDto {
  @IsEnum(ConfigurationType)
  type: ConfigurationType;

  @IsInt()
  @IsOptional()
  id?: number;

  @IsString()
  deviceId: string;

  @IsString()
  name: string;

  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(100)
  temperature: number;

  @ValidateNested()
  @Type(() => ConnectedDeviceDto)
  heatActuator: ConnectedDeviceDto;

  @ValidateNested()
  @Type(() => ConnectedDeviceDto)
  tempSensor: ConnectedDeviceDto;

  @IsInt()
  @Min(0)
  heatingPeriod: number;

  @IsNumber({ maxDecimalPlaces: 1 })
  p: number;

  @IsNumber({ maxDecimalPlaces: 1 })
  i: number;

  @IsNumber({ maxDecimalPlaces: 1 })
  d: number;

  @IsBoolean()
  archived: boolean;
}
