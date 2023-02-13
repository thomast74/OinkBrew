import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Device } from '@prisma/client';
import { ParticleService } from '../common/particle.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectedDevice } from './types';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    private prisma: PrismaService,
    private particle: ParticleService,
  ) {}

  public async findAll(): Promise<Device[]> {
    return await this.prisma.client.device.findMany();
  }

  public async findById(deviceId: string): Promise<Device | null> {
    return await this.prisma.client.device.findUnique({
      where: {
        id: deviceId,
      },
    });
  }

  public async update(
    deviceId: string,
    name: string,
    notes?: string,
  ): Promise<Device> {
    const device = await this.findById(deviceId);
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    try {
      device.name = name;
      device.notes = notes ?? null;
      await this.save(device);

      await this.particle.updateDevice(deviceId, name, notes);

      return device;
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Unknown error');
    }
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
    const cDevices = ConnectedDevice.parseArray(
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
