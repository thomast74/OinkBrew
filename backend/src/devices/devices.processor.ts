import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Device, Prisma } from '@prisma/client';
import { Job } from 'bull';
import { ParticleService } from '../common/particle.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectedDevice } from './types';

@Processor('devices')
export class DevicesProcessor {
  private readonly logger = new Logger(DevicesProcessor.name);

  constructor(
    private particle: ParticleService,
    private prisma: PrismaService,
  ) {}

  @Process('refresh')
  async refresh(job: Job) {
    this.logger.debug('Start refreshing...');
    try {
      const devices = await this.particle.listDevices();
      this.logger.debug(`Retrieved ${devices.length} devices`);
      for (const device of devices) {
        let storedDevice = await this.findDevice(device.id);
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

          const connectedDevices = ConnectedDevice.parseArray(
            JSON.parse(
              await this.particle.getVariable(storedDevice.id, 'Devices'),
            ),
          );
          storedDevice.connectedDevices = this.updateConnectedDevices(
            storedDevice,
            connectedDevices,
          );
        } else if (!storedDevice.connectedDevices) {
          storedDevice.connectedDevices = [];
        }

        await this.prisma.client.device.upsert({
          where: {
            id: storedDevice.id,
          },
          update: storedDevice as any,
          create: storedDevice as any,
        });
      }
    } catch (error) {
      this.logger.error(error);
      await job.moveToFailed({
        message: `${error}`,
      });
    }
  }

  private async findDevice(deviceId: string): Promise<Device | null> {
    return await this.prisma.client.device.findUnique({
      where: {
        id: deviceId,
      },
    });
  }

  private updateConnectedDevices(
    device: Device,
    connectedDevices: ConnectedDevice[],
  ): Prisma.JsonArray {
    const cDevices = ConnectedDevice.parseArray(
      (device.connectedDevices as any[]) ?? [],
    ).map((cDevice) => {
      cDevice.connected = false;
      return cDevice;
    });

    connectedDevices.forEach((connectedDevice) => {
      const index = cDevices.findIndex((cDevice) =>
        connectedDevice.equals(cDevice),
      );
      if (index >= 0) {
        cDevices[index].connected = true;
      } else {
        connectedDevice.connected = true;
        cDevices.push(connectedDevice);
      }
    });

    return ConnectedDevice.toJsonArray(cDevices);
  }
}