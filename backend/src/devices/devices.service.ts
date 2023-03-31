import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConnectedDevice, Device } from '@prisma/client';
import { ParticleService } from '../common/particle.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectedDeviceHelper } from './helpers';

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...deviceUpdate } = device;
    await this.prisma.client.device.upsert({
      where: {
        id: device.id,
      },
      update: deviceUpdate,
      create: device,
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

    const cDevice = this.findConnectedDevice(
      device.connectedDevices,
      pinNr,
      hwAddress,
    );
    if (!cDevice) {
      this.logger.error(
        'updateConnectedDeviceWithNameAndOffset => Connected device not found',
      );
      throw new NotFoundException('Connected device not found');
    }

    cDevice.name = name;
    cDevice.offset = offset;
    this.replaceConnectedDevice(device, cDevice);
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
    if (!device.connectedDevices) {
      device.connectedDevices = [];
    }

    const cDevice = this.findConnectedDevice(
      device.connectedDevices,
      connectedDevice.pinNr,
      connectedDevice.hwAddress,
    );

    if (cDevice) {
      cDevice.connected = connectStatus;
      cDevice.deviceOffset = connectedDevice.deviceOffset;
      this.replaceConnectedDevice(device, cDevice);
    } else {
      if (connectStatus) {
        connectedDevice.connected = connectStatus;
        device.connectedDevices.push(connectedDevice);
      } else {
        return null;
      }
    }

    return device;
  }

  public findConnectedDeviceFromDevice(
    device: Device,
    pinNr: number,
    hwAddress: string,
  ): ConnectedDevice | undefined {
    const cDevices = ConnectedDeviceHelper.parseArray(
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

  private replaceConnectedDevice(device: Device, cDevice: ConnectedDevice) {
    const index = device.connectedDevices.findIndex(
      (connectedDevice) =>
        connectedDevice.pinNr === cDevice.pinNr &&
        connectedDevice.hwAddress === cDevice.hwAddress,
    );
    device.connectedDevices.splice(index, 1, cDevice);
  }
}
