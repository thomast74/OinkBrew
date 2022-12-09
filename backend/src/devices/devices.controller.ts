import { InjectQueue } from '@nestjs/bull';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { Device } from '@prisma/client';
import { Queue } from 'bull';

@Controller('devices')
export class DevicesController {
  private readonly logger = new Logger(DevicesController.name);

  constructor(@InjectQueue('devices') private readonly devicesQueue: Queue) {
    this.devicesQueue.add('refresh');
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  get(): Promise<Device[]> {
    return Promise.resolve([]);
  }

  @Post('/refresh')
  refresh(): Promise<void> {
    this.devicesQueue.add('refresh');
    return Promise.resolve();
  }
}
