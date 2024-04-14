import {
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  MessageEvent,
  Param,
  ParseBoolPipe,
  Post,
  Put,
  Query,
  Sse,
} from '@nestjs/common';

import { formatISO } from 'date-fns';
import { Observable, map } from 'rxjs';

import { getErrorMessage } from '../helpers/error.converter';
import { ConfigurationsService } from './configurations.service';
import { ValidConfigurationBody } from './decorators';
import { ConfigurationDto } from './dtos';
import { ConfigurationDocument, ConfigurationSensorDatas } from './schemas';

@Controller('configurations')
export class ConfigurationsController {
  constructor(private configurations: ConfigurationsService) {}

  @Get('/:id/sensordata')
  @HttpCode(HttpStatus.OK)
  async getSensorData(@Param('id') id: string): Promise<ConfigurationSensorDatas> {
    const sensorData = (await this.configurations.findSensorData(+id)) ?? [];
    return {
      publishedAt: formatISO(new Date()),
      configurationId: +id,
      sensorData,
    };
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  async getList(
    @Query('archived', new DefaultValuePipe(false), ParseBoolPipe)
    archived = false,
  ): Promise<ConfigurationDocument[]> {
    try {
      return (await this.configurations.findAll(archived)) ?? [];
    } catch (error) {
      throw new InternalServerErrorException(getErrorMessage(error));
    }
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  create(@ValidConfigurationBody() configuration: ConfigurationDto) {
    return this.configurations.save(configuration);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.CREATED)
  update(@Param('id') id: number, @ValidConfigurationBody() configuration: ConfigurationDto) {
    return this.configurations.update(id, configuration);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: number) {
    return this.configurations.delete(id);
  }

  @Sse('/:id/sse')
  events(@Param('id') id: string): Observable<MessageEvent> {
    return this.configurations.getEventSensorData(+id).pipe(
      map((event) => {
        return {
          data: event,
          type: 'SensorData',
          retry: 0,
        };
      }),
    );
  }
}
