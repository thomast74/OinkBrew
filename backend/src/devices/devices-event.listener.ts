// start listening to Particle events
// receive events
// distribute events:
//    oinkbrew/start
//    oinkbrew/devices/new
//    oinkbrew/devices/remove
//    oinkbrew/devices/values

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ParticleService } from '../common/particle.service';
import { DevicesService } from './devices.service';
import { ConnectedDevice, EventData } from './types';

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
        this.oinkbrewNewDevice(eventData);
        break;
      case 'oinkbrew/devices/remove':
        this.oinkbrewRemoveDevice(eventData);
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

  private oinkbrewNewDevice(eventData: EventData) {
    this.devices.updateConnectedDeviceWithConnectStatus(
      eventData.coreid,
      ConnectedDevice.parseData(JSON.parse(eventData.data)),
      true,
    );
  }

  private oinkbrewRemoveDevice(eventData: EventData) {
    this.devices.updateConnectedDeviceWithConnectStatus(
      eventData.coreid,
      ConnectedDevice.parseData(JSON.parse(eventData.data)),
      false,
    );
  }
}
