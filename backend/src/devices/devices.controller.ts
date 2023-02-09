import { InjectQueue } from '@nestjs/bull';
import {
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  OnApplicationBootstrap,
  Post,
} from '@nestjs/common';
import { Device } from '@prisma/client';
import { Queue } from 'bull';
import { DevicesEventListener } from './devices-event.listener';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController implements OnApplicationBootstrap {
  private readonly logger = new Logger(DevicesController.name);

  constructor(
    @InjectQueue('devices') private readonly devicesQueue: Queue,
    private devices: DevicesService,
    private eventListener: DevicesEventListener,
  ) {}

  onApplicationBootstrap() {
    this.devicesQueue.add('refresh');
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  async getListOfDevices(): Promise<Device[]> {
    try {
      const devices = await this.devices.findAll();
      return devices;
    } catch (error) {
      throw new HttpException(
        error.message ?? error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/refresh')
  @HttpCode(HttpStatus.OK)
  refresh(): Promise<boolean> {
    this.devicesQueue.add('refresh');
    return Promise.resolve(true);
  }
}
