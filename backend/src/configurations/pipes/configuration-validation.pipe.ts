import {
  BadRequestException,
  Injectable,
  ValidationPipe,
} from '@nestjs/common';

import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { iterate } from 'iterare';

import { BrewConfigurationDto, FridgeConfigurationDto } from '../dtos';
import { ConfigurationType } from '../types';

@Injectable()
export class ConfigurationValidationPipe extends ValidationPipe {
  override async transform(value: any) {
    let errors: ValidationError[] = [];

    if (value?.type === ConfigurationType.BREW) {
      const object = plainToInstance(BrewConfigurationDto, value);
      errors = await validate(object);
      if (errors?.length === 0) {
        return value;
      }
    }

    if (value?.type === ConfigurationType.FRIDGE) {
      const object = plainToInstance(FridgeConfigurationDto, value);
      errors = await validate(object);

      if (errors?.length === 0) {
        return value;
      }
    }

    throw new BadRequestException(
      this.flattenValidationErrors(errors),
      'Configuration not valid',
    );
  }
}
