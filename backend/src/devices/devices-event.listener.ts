// start listening to Particle events
// receive events
// distribute events:
//    oinkbrew/start
//    oinkbrew/devices/new
//    oinkbrew/devices/remove
//    oinkbrew/devices/values
import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  OnModuleDestroy,
} from '@nestjs/common';

import { de } from 'date-fns/locale';
import { Subscription } from 'rxjs';

import { ParticleService } from '../common/particle.service';
import { Configuration } from '../configurations/schemas';
import { DevicesService } from './devices.service';
import { ConnectedDeviceHelper } from './helpers';
import { ConnectedDevice, Device } from './schemas';
import { ConnectedDeviceType, EventData } from './types';

@Injectable()
export class DevicesEventListener
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(DevicesEventListener.name);
  private eventStreamRunning = false;
  private eventStreamSubscription?: Subscription = undefined;

  constructor(
    private particle: ParticleService,
    private devices: DevicesService,
  ) {}

  onApplicationBootstrap() {
    if (this.eventStreamRunning) return;

    this.startEventStream();
    this.eventStreamRunning = true;
  }

  onApplicationShutdown() {
    if (this.eventStreamSubscription) {
      this.eventStreamSubscription.unsubscribe();
    }
  }

  private startEventStream(retryCount = 3) {
    this.eventStreamSubscription = this.particle.eventStream().subscribe({
      next: (data) => {
        this.eventProcessor(data);
      },
      error: () => {
        if (retryCount > 0) {
          setTimeout(() => {
            retryCount--;
            this.startEventStream(retryCount);
          }, 750);
        } else {
          this.logger.error('Tried to start stream 3 times, giving up');
        }
      },
    });
  }

  private eventProcessor(eventData: EventData) {
    this.logger.log(`Received particle event: ${eventData.name}`);
    switch (eventData.name) {
      case 'oinkbrew/start':
        this.oinkbrewStart(eventData);
        break;
      case 'oinkbrew/devices/new':
        this.oinkbrewNewConnectedDevice(eventData);
        break;
      case 'oinkbrew/devices/remove':
        this.oinkbrewRemoveConnectedDevice(eventData);
        break;
      case 'oinkbrew/devices/values':
        // TODO: add new sensor data values to cofiguration
        break;
    }
  }

  private async oinkbrewStart(eventData: EventData): Promise<void> {
    try {
      const deviceId = eventData.coreid;
      const device = await this.devices.findById(deviceId);

      if (!device) return;

      await device.populate('configurations');

      for (const configuration of device.configurations) {
        this.sendConfiguration(deviceId, configuration);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  private async oinkbrewNewConnectedDevice(
    eventData: EventData,
  ): Promise<void> {
    const data = ConnectedDeviceHelper.parseData(JSON.parse(eventData.data));
    const device = await this.devices.updateConnectedDeviceWithConnectStatus(
      eventData.coreid,
      data,
      true,
    );

    if (device) {
      this.updateConnectedDeviceOffsetIfNeeded(
        device,
        data.pinNr,
        data.hwAddress,
      );
    }
  }

  private oinkbrewRemoveConnectedDevice(eventData: EventData) {
    this.devices.updateConnectedDeviceWithConnectStatus(
      eventData.coreid,
      ConnectedDeviceHelper.parseData(JSON.parse(eventData.data)),
      false,
    );
  }

  private async updateConnectedDeviceOffsetIfNeeded(
    device: Device,
    pinNr: number,
    hwAddress: string,
  ): Promise<void> {
    const cDevice = ConnectedDeviceHelper.findConnectedDeviceFromDevice(
      device,
      pinNr,
      hwAddress,
    );

    if (!cDevice) return;

    await this.sendConnectedDeviceOffsetIfNeeded(device.id, cDevice);
  }

  private async sendConnectedDeviceOffsetIfNeeded(
    deviceId: string,
    cDevice: ConnectedDevice,
  ): Promise<void> {
    if (
      cDevice.type === ConnectedDeviceType.ONEWIRE_TEMP &&
      cDevice.connected &&
      cDevice.offset &&
      cDevice.offset !== 0.0
    ) {
      this.particle.updateConnectedDeviceOffset(
        deviceId,
        cDevice.pinNr,
        cDevice.hwAddress,
        cDevice.offset,
      );
    }
  }
  private async sendConfiguration(
    deviceId: string,
    configuration: Configuration,
  ): Promise<void> {
    if (configuration.archived) return;

    if (!configuration.device) {
      configuration.device = { id: deviceId } as any;
    }
    if (!configuration.device.id) {
      configuration.device.id = deviceId;
    }

    try {
      await this.particle.sendConfiguration(configuration);
    } catch (error) {
      this.logger.error(`Send Configuration: ${error}`);
    }
  }
}
