import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';

import { Job } from 'bull';

import { ParticleService } from '../common/particle.service';
import { DevicesService } from './devices.service';
import { ConnectedDeviceHelper } from './helpers';
import { ConnectedDevice, Device } from './schemas';

@Processor('devices')
export class DevicesProcessor {
  private readonly logger = new Logger(DevicesProcessor.name);

  constructor(
    private particle: ParticleService,
    private devicesSvc: DevicesService,
  ) {}

  @Process('refresh')
  async refresh(job: Job) {
    this.logger.log('Start refreshing...');
    try {
      const devices = await this.particle.listDevices();
      this.logger.log(`Retrieved ${devices.length} devices`);
      for (const device of devices) {
        let storedDevice: Device;
        try {
          storedDevice = (await this.devicesSvc.findById(device.id)) as Device;
        } catch {
          storedDevice = {
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Device;
        }

        storedDevice = {
          ...storedDevice,
          ...device,
        };

        if (storedDevice.connected) {
          storedDevice.shieldVersion = +(await this.particle.getVariable(
            storedDevice.id,
            'ShieldVersion',
          )) as number;

          storedDevice.firmwareVersion = +(await this.particle.getVariable(
            storedDevice.id,
            'Version',
          ));

          const connectedDevices = ConnectedDeviceHelper.parseArray(
            JSON.parse(
              await this.particle.getVariable(storedDevice.id, 'Devices'),
            ),
          );
          this.updateConnectedDevices(storedDevice, connectedDevices);
        } else if (!storedDevice.connectedDevices) {
          storedDevice.connectedDevices = [];
        }

        await this.devicesSvc.save(storedDevice);
      }
    } catch (error) {
      this.logger.error(error);
      await job.moveToFailed({
        message: `${error}`,
      });
    }
  }

  private updateConnectedDevices(
    device: Device,
    rConnectedDevices: ConnectedDevice[],
  ) {
    if (!device.connectedDevices) {
      device.connectedDevices = [];
    }

    device.connectedDevices.forEach((sConnectedDevice) => {
      sConnectedDevice.connected = false;
    });

    rConnectedDevices.forEach((rConnectedDevice) => {
      const index = device.connectedDevices.findIndex((sConnectedDevice) =>
        ConnectedDeviceHelper.equals(rConnectedDevice, sConnectedDevice),
      );

      if (index >= 0) {
        device.connectedDevices[index].connected = true;
        device.connectedDevices[index].deviceOffset =
          rConnectedDevice.deviceOffset;
      } else {
        rConnectedDevice.connected = true;
        device.connectedDevices.push(rConnectedDevice);
      }
    });
  }
}
