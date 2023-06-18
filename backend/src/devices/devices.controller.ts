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
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';

import { Queue } from 'bull';

import { DevicesService } from './devices.service';
import { DeviceConnectedDeviceGuard, DeviceNameGuard } from './guards';
import { Device, DeviceDocument } from './schemas';

@Controller('devices')
export class DevicesController implements OnApplicationBootstrap {
  private readonly logger = new Logger(DevicesController.name);

  constructor(
    @InjectQueue('devices') private readonly devicesQueue: Queue,
    private devices: DevicesService,
  ) {}

  onApplicationBootstrap() {
    this.devicesQueue.add('refresh');
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  async getListOfDevices(): Promise<DeviceDocument[]> {
    try {
      return await this.devices.findAll();
    } catch (error) {
      throw new HttpException(
        error.message ?? error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('/:id/:hwAddress/:pinNr')
  @UseGuards(DeviceConnectedDeviceGuard)
  @HttpCode(HttpStatus.OK)
  async updateConnectedDevice(
    @Param('id') id: string,
    @Param('pinNr', ParseIntPipe) pinNr: number,
    @Param('hwAddress') hwAddress: string,
    @Body('name') name: string,
    @Body('offset') offset: number,
  ): Promise<Device | null> {
    return this.devices.updateConnectedDeviceWithNameAndOffset(
      id,
      pinNr,
      hwAddress,
      name,
      offset,
    );
  }

  @Put('/:id/restart')
  @HttpCode(HttpStatus.OK)
  async restartDevice(@Param('id') id: string): Promise<boolean> {
    await this.devices.restart(id);
    return true;
  }

  @Put('/refresh')
  @HttpCode(HttpStatus.OK)
  refresh(): Promise<boolean> {
    this.devicesQueue.add('refresh');
    return Promise.resolve(true);
  }

  @Put('/:id')
  @UseGuards(DeviceNameGuard)
  @HttpCode(HttpStatus.OK)
  async updateDevice(
    @Param('id') id: string,
    @Body('name') name: string,
    @Body('notes') notes?: string,
  ): Promise<Device | null> {
    return this.devices.update(id, name, notes);
  }
}
