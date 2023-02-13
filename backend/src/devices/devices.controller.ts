import { InjectQueue } from '@nestjs/bull';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  OnApplicationBootstrap,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Device } from '@prisma/client';
import { Queue } from 'bull';
import { DevicesEventListener } from './devices-event.listener';
import { DevicesService } from './devices.service';
import { DeviceNameGuard } from './guards';

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

  @Post('/:id')
  @UseGuards(DeviceNameGuard)
  @HttpCode(HttpStatus.OK)
  async updateDevice(
    @Param('id') id: string,
    @Body('name') name: string,
    @Body('notes') notes?: string,
  ): Promise<Device | null> {
    return this.devices.update(id, name, notes);
  }

  @Put('/refresh')
  @HttpCode(HttpStatus.OK)
  refresh(): Promise<boolean> {
    this.devicesQueue.add('refresh');
    return Promise.resolve(true);
  }
}
