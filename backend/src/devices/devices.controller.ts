import { InjectQueue } from '@nestjs/bull';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  OnApplicationBootstrap,
  Post,
} from '@nestjs/common';
import { Device } from '@prisma/client';
import { Queue } from 'bull';
import { DevicesEventListener } from './devices-event.listener';

@Controller('devices')
export class DevicesController implements OnApplicationBootstrap {
  private readonly logger = new Logger(DevicesController.name);

  constructor(
    @InjectQueue('devices') private readonly devicesQueue: Queue,
    private eventListener: DevicesEventListener,
  ) {}

  onApplicationBootstrap() {
    this.devicesQueue.add('refresh');
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  get(): Promise<Device[]> {
    return Promise.resolve([]);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(): Promise<boolean> {
    this.devicesQueue.add('refresh');
    return Promise.resolve(true);
  }
}
