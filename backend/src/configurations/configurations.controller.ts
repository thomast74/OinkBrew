import {
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  ParseBoolPipe,
  Query,
} from '@nestjs/common';

import { ConfigurationsService } from './configurations.service';
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
      throw new HttpException(
        error.message ?? error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
