// start listening to Particle events
// receive events
// distribute events:
//    oinkbrew/start
//    oinkbrew/devices/new
//    oinkbrew/devices/remove
//    oinkbrew/devices/values

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConnectedDeviceType, Device } from '@prisma/client';
import { ParticleService } from '../common/particle.service';
import { DevicesService } from './devices.service';
import { ConnectedDeviceHelper } from './helpers';
import { EventData } from './types';

@Injectable()
export class DevicesEventListener implements OnApplicationBootstrap {
  private readonly logger = new Logger(DevicesEventListener.name);

  constructor(
    private particle: ParticleService,
    private devices: DevicesService,
  ) {}

  onApplicationBootstrap() {
    this.startEventStream();
  }

  private startEventStream(retryCount = 3) {
    this.particle.eventStream().subscribe({
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

  private oinkbrewStart(eventData: EventData) {
    // TODO: send offset data
    // TODO: send active configuration to device
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
    const cDevice = this.devices.findConnectedDeviceFromDevice(
      device,
      pinNr,
      hwAddress,
    );

    if (!cDevice) {
      return;
    }

    if (
      cDevice.type === ConnectedDeviceType.ONEWIRE_TEMP &&
      cDevice.connected &&
      cDevice.offset !== 0.0
    ) {
      this.particle.updateConnectedDeviceOffset(
        device.id,
        pinNr,
        hwAddress,
        cDevice.offset,
      );
    }
  }
}
