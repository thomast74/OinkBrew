import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { ParticleService } from '../common/particle.service';
import { getErrorMessage } from '../helpers/error.converter';
import { ConnectedDeviceHelper } from './helpers';
import { ConnectedDevice, Device, DeviceDocument } from './schemas';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    @InjectModel(Device.name) private deviceModel: Model<Device>,
    private particle: ParticleService,
  ) {}

  public async findAll(): Promise<DeviceDocument[]> {
    try {
      return await this.deviceModel.find().exec();
    } catch {
      return [];
    }
  }

  public async findById(deviceId: string): Promise<DeviceDocument> {
    let device: DeviceDocument | null = null;
    try {
      device = await this.deviceModel.findOne({ id: deviceId }).exec();
    } catch (error) {
      throw new InternalServerErrorException(getErrorMessage(error));
    }

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return device;
  }

  public async update(deviceId: string, name: string, notes?: string): Promise<DeviceDocument> {
    const device = await this.findById(deviceId);

    try {
      device.name = name;
      device.notes = notes;
      await this.save(device);
    } catch (error) {
      this.logger.error(`Update => General error: ${error}`);
      throw new InternalServerErrorException(getErrorMessage(error));
    }

    const updateResponse = await this.particle.updateDevice(deviceId, name, notes);
    if (!updateResponse.isSuccessful) {
      throw new InternalServerErrorException(`${updateResponse.errorCode}: ${updateResponse.info}`);
    }

    return device;
  }

  public async save(device: Device): Promise<void> {
    try {
      await this.deviceModel.findOneAndUpdate({ id: device.id }, device, { upsert: true }).exec();
      this.logger.debug(`Saved ${device.id} to database`);
    } catch (error) {
      throw new InternalServerErrorException(getErrorMessage(error));
    }
  }

  public async addConnectedDeviceWithConnectStatus(
    deviceId: string,
    connectedDevice: ConnectedDevice,
  ): Promise<void> {
    await this.updateConnectedDeviceWithConnectStatus(deviceId, connectedDevice, true);
  }

  public async updateConnectedDeviceWithNameAndOffset(
    deviceId: string,
    pinNr: number,
    hwAddress: string,
    name: string,
    offset: number,
  ): Promise<DeviceDocument> {
    const device = await this.findById(deviceId);
    if (!device) {
      this.logger.error('updateConnectedDeviceWithNameAndOffset => Device not found');
      throw new NotFoundException('Device not found');
    }

    const cDevice = ConnectedDeviceHelper.findConnectedDevice(
      device.connectedDevices,
      pinNr,
      hwAddress,
    );
    if (!cDevice) {
      this.logger.error('updateConnectedDeviceWithNameAndOffset => Connected device not found');
      throw new NotFoundException('Connected device not found');
    }

    cDevice.name = name;
    cDevice.offset = offset;
    this.replaceConnectedDevice(device, cDevice);
    await this.save(device);

    if (device.online) {
      try {
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
      } catch (error: any) {
        throw new InternalServerErrorException(getErrorMessage(error));
      }
    }

    return device;
  }

  public async updateConnectedDeviceWithConnectStatus(
    deviceId: string,
    connectedDevice: ConnectedDevice,
    connectStatus: boolean,
  ): Promise<DeviceDocument> {
    let device = await this.findById(deviceId);

    device = this.markOrAddConnectedDevice(device, connectedDevice, connectStatus);
    if (!device) {
      this.logger.warn(`Connected Device not found, so nothing to do`);
      return device;
    }

    await this.save(device);

    return device;
  }

  public async restart(deviceId: string): Promise<boolean> {
    const updateResponse = await this.particle.restart(deviceId);

    if (!updateResponse.isSuccessful) {
      throw new InternalServerErrorException(`${updateResponse.errorCode}: ${updateResponse.info}`);
    }

    return true;
  }

  private markOrAddConnectedDevice(
    device: DeviceDocument,
    connectedDevice: ConnectedDevice,
    connectStatus: boolean,
  ): DeviceDocument {
    if (!device.connectedDevices) {
      device.connectedDevices = [];
    }

    const cDevice = ConnectedDeviceHelper.findConnectedDevice(
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
      }
    }

    return device;
  }

  private replaceConnectedDevice(device: DeviceDocument, cDevice: ConnectedDevice) {
    const index = device.connectedDevices.findIndex(
      (connectedDevice) =>
        connectedDevice.pinNr === cDevice.pinNr && connectedDevice.hwAddress === cDevice.hwAddress,
    );
    device.connectedDevices.splice(index, 1, cDevice);
  }
}
