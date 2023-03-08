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
      this.logger.error('Update => Device not found');
      throw new NotFoundException('Device not found');
    }

    try {
      device.name = name;
      device.notes = notes ?? null;
      await this.save(device);
    } catch (error) {
      this.logger.error(`Update => General error: ${error}`);
      throw new InternalServerErrorException(error.message || 'Unknown error');
    }

    const updateResponse = await this.particle.updateDevice(
      deviceId,
      name,
      notes,
    );
    if (!updateResponse.isSuccessful) {
      throw new InternalServerErrorException(
        `${updateResponse.errorCode}: ${updateResponse.info}`,
      );
    }

    return device;
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

  public async addConnectedDeviceWithConnectStatus(
    deviceId: string,
    connectedDevice: ConnectedDevice,
  ): Promise<void> {
    await this.updateConnectedDeviceWithConnectStatus(
      deviceId,
      connectedDevice,
      true,
    );
  }

  public async updateConnectedDeviceWithNameAndOffset(
    deviceId: string,
    pinNr: number,
    hwAddress: string,
    name: string,
    offset: number,
  ): Promise<Device | null> {
    const device = await this.findById(deviceId);
    if (!device) {
      this.logger.error(
        'updateConnectedDeviceWithNameAndOffset => Device not found',
      );
      throw new NotFoundException('Device not found');
    }

    const cDevices = ConnectedDevice.parseArray(
      (device.connectedDevices as any[]) ?? [],
    );

    const cDevice = this.findConnectedDevice(cDevices, pinNr, hwAddress);
    if (!cDevice) {
      this.logger.error(
        'updateConnectedDeviceWithNameAndOffset => Connected device not found',
      );
      throw new NotFoundException('Connected device not found');
    }

    cDevice.name = name;
    cDevice.offset = offset;
    this.replaceConnectedDevice(cDevices, cDevice);
    device.connectedDevices = ConnectedDevice.toJsonArray(cDevices);
    await this.save(device);

    if (device.online) {
      const updateResponse = await this.particle.updateConnectedDeviceOffset(
        deviceId,
        pinNr,
        hwAddress,
        offset,
      );

      if (!updateResponse.isSuccessful) {
        throw new InternalServerErrorException(
          `${updateResponse.errorCode}: ${updateResponse.info}`,
        );
      }
    }

    return device;
  }

  public async updateConnectedDeviceWithConnectStatus(
    deviceId: string,
    connectedDevice: ConnectedDevice,
    connectStatus: boolean,
  ): Promise<Device | null> {
    let device = await this.findById(deviceId);
    if (!device) {
      this.logger.warn(
        `Device ${deviceId} was not found, can't remove connected device`,
      );
      return null;
    }

    device = this.markOrAddConnectedDevice(
      device,
      connectedDevice,
      connectStatus,
    );
    if (!device) {
      this.logger.warn(`Connected Device not found, so nothing to do`);
      return null;
    }

    await this.save(device);

    return device;
  }

  public async restart(deviceId: string): Promise<boolean> {
    const updateResponse = await this.particle.restart(deviceId);

    if (!updateResponse.isSuccessful) {
      throw new InternalServerErrorException(
        `${updateResponse.errorCode}: ${updateResponse.info}`,
      );
    }

    return true;
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
      connectedDevice.pinNr,
      connectedDevice.hwAddress,
    );

    if (cDevice) {
      cDevice.connected = connectStatus;
      cDevice.deviceOffset = connectedDevice.deviceOffset;
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

  public findConnectedDeviceFromDevice(
    device: Device,
    pinNr: number,
    hwAddress: string,
  ): ConnectedDevice | undefined {
    const cDevices = ConnectedDevice.parseArray(
      (device.connectedDevices as any[]) ?? [],
    );

    return this.findConnectedDevice(cDevices, pinNr, hwAddress);
  }

  private findConnectedDevice(
    cDevices: ConnectedDevice[],
    pinNr: number,
    hwAddress: string,
  ): ConnectedDevice | undefined {
    const connectedDevice = cDevices?.find(
      (cDevice) => cDevice.pinNr === pinNr && cDevice.hwAddress === hwAddress,
    );

    return connectedDevice;
  }

  private replaceConnectedDevice(
    cDevices: ConnectedDevice[],
    cDevice: ConnectedDevice,
  ) {
    const index = cDevices.findIndex(
      (connectedDevice) =>
        connectedDevice.pinNr === cDevice.pinNr &&
        connectedDevice.hwAddress === cDevice.hwAddress,
    );
    cDevices.splice(index, 1, cDevice);
  }
}
