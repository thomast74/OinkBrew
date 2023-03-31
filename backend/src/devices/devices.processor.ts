import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { ConnectedDevice, Device } from '@prisma/client';
import { Job } from 'bull';
import { ParticleService } from '../common/particle.service';
import { DevicesService } from './devices.service';
import { ConnectedDeviceHelper } from './helpers';

@Processor('devices')
export class DevicesProcessor {
  private readonly logger = new Logger(DevicesProcessor.name);

  constructor(
    private particle: ParticleService,
    private devices: DevicesService,
  ) {}

  @Process('refresh')
  async refresh(job: Job) {
    this.logger.log('Start refreshing...');
    try {
      const devices = await this.particle.listDevices();
      this.logger.log(`Retrieved ${devices.length} devices`);
      for (const device of devices) {
        let storedDevice = await this.devices.findById(device.id);
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

        await this.devices.save(storedDevice);
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
