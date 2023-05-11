import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  ParseBoolPipe,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { ConfigurationsService } from './configurations.service';
import { ValidConfigurationBody } from './decorators';
import { ConfigurationDto } from './dtos';
import { ConfigurationValidationPipe } from './pipes';
import { ConfigurationDocument } from './schemas';

@Controller('configurations')
export class ConfigurationsController {
  private readonly logger = new Logger(ConfigurationsController.name);

  constructor(private configurations: ConfigurationsService) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  async getListOfConfigurations(
    @Query('archived', new DefaultValuePipe(false), ParseBoolPipe)
    archived = false,
  ): Promise<ConfigurationDocument[]> {
    try {
      return (await this.configurations.findAll(archived)) ?? [];
    } catch (error) {
      throw new InternalServerErrorException(error.message ?? error);
    }
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  async createConfiguration(
    @ValidConfigurationBody() configuration: ConfigurationDto,
  ) {
    return this.configurations.save(configuration);
  }
}
