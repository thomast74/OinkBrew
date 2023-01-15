import { Injectable, Logger } from '@nestjs/common';
import { Device } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectedDevice } from './types';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(private prisma: PrismaService) {}

  public async findById(deviceId: string): Promise<Device | null> {
    return await this.prisma.client.device.findUnique({
      where: {
        id: deviceId,
      },
    });
  }

  public async save(device: Device): Promise<void> {
    await this.prisma.client.device.upsert({
      where: {
        id: device.id,
      },
      update: device as any,
      create: device as any,
    });
    this.logger.debug(`Saved ${device.id} to database`);
  }

  public async addConnectedDevice(
    deviceId: string,
    connectedDevice: ConnectedDevice,
  ): Promise<void> {
    await this.updateConnectedDevice(deviceId, connectedDevice, true);
  }

  public async updateConnectedDevice(
    deviceId: string,
    connectedDevice: ConnectedDevice,
    connectStatus: boolean,
  ): Promise<void> {
    let device = await this.findById(deviceId);
    if (!device) {
      this.logger.warn(
        `Device ${deviceId} was not found, can't remove connected device`,
      );
      return;
    }

    device = this.markOrAddConnectedDevice(
      device,
      connectedDevice,
      connectStatus,
    );
    if (!device) {
      this.logger.warn(`Connected Device not found, so nothing to do`);
      return;
    }

    await this.save(device);
  }

  private markOrAddConnectedDevice(
    device: Device,
    connectedDevice: ConnectedDevice,
    connectStatus: boolean,
  ): Device | null {
    let cDevices = ConnectedDevice.parseArray(
      (device.connectedDevices as any[]) ?? [],
    );

    const cDevice = this.findConnectedDevice(
      cDevices,
      connectedDevice.pin_nr,
      connectedDevice.hw_address,
    );

    if (cDevice) {
      cDevice.connected = connectStatus;
      this.replaceConnectedDevice(cDevices, cDevice);
    } else {
      if (connectStatus) {
        connectedDevice.connected = connectStatus;
        cDevices.push(connectedDevice);
      } else {
        return null;
      }
    }

    device.connectedDevices = ConnectedDevice.toJsonArray(cDevices);

    return device;
  }

  private findConnectedDevice(
    cDevices: ConnectedDevice[],
    pin_nr: string,
    hw_address: string,
  ): ConnectedDevice | undefined {
    const connectedDevice = cDevices?.find(
      (cDevice) =>
        cDevice.pin_nr === pin_nr && cDevice.hw_address === hw_address,
    );

    return connectedDevice;
  }

  private replaceConnectedDevice(
    cDevices: ConnectedDevice[],
    cDevice: ConnectedDevice,
  ) {
    const index = cDevices.findIndex(
      (connectedDevice) =>
        connectedDevice.pin_nr === cDevice.pin_nr &&
        connectedDevice.hw_address === cDevice.hw_address,
    );
    cDevices.splice(index, 1, cDevice);
  }
}
