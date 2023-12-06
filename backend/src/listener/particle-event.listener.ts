import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';

import { formatISO } from 'date-fns';
import { Subscription } from 'rxjs';

import { ParticleService } from '../common/particle.service';
import { ConfigurationsService } from '../configurations/configurations.service';
import { Configuration } from '../configurations/schemas';
import { DevicesService } from '../devices/devices.service';
import { ConnectedDeviceHelper } from '../devices/helpers';
import { ConnectedDevice, Device } from '../devices/schemas';
import { ConnectedDeviceType, EventData } from '../devices/types';

type EventValueData = {
  pinNr: number;
  hwAddress: string;
  value: number;
};

@Injectable()
export class ParticleEventListener implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ParticleEventListener.name);
  private eventStreamRunning = false;
  private eventStreamSubscription?: Subscription = undefined;

  constructor(
    private particle: ParticleService,
    private devices: DevicesService,
    private configurations: ConfigurationsService,
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
        try {
          this.eventProcessor(data);
        } catch (error) {
          this.logger.error(error);
        }
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
      case 'oinkbrew/device/values':
        this.oinkbrewNewData(eventData);
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

  private async oinkbrewNewConnectedDevice(eventData: EventData): Promise<void> {
    const data = ConnectedDeviceHelper.parseData(JSON.parse(eventData.data));
    const device = await this.devices.updateConnectedDeviceWithConnectStatus(
      eventData.coreid,
      data,
      true,
    );

    if (device) {
      this.updateConnectedDeviceOffsetIfNeeded(device, data.pinNr, data.hwAddress);
    }
  }

  private async oinkbrewNewData(eventData: EventData): Promise<void> {
    const data = (JSON.parse(eventData.data) as any[]).map((item) => {
      return {
        pinNr: +item.pinNr,
        hwAddress: item.hwAddress,
        value: item.value,
      } as EventValueData;
    });

    const configurations = await this.configurations.findByDevice(eventData.coreid);
    if (!configurations) return;

    const activeConfigurations = configurations.filter((confs) => !confs.archived);

    for (const valueData of data) {
      activeConfigurations
        .filter((configuration) =>
          (configuration as any).hasConnectedDevice(valueData.pinNr, valueData.hwAddress),
        )
        .forEach((configuration) => {
          const connectedDevice = ConnectedDeviceHelper.findConnectedDeviceFromDevice(
            configuration.device,
            valueData.pinNr,
            valueData.hwAddress,
          );

          const sensorData = {
            name: connectedDevice?.name ?? `${valueData.pinNr}/${valueData.hwAddress}`,
            value: valueData.value,
          };

          if (!configuration.sensorData) {
            configuration.sensorData = new Map();
          }

          const key = formatISO(eventData.published_at);
          let currentSensorData = configuration.sensorData.get(key);
          if (!currentSensorData) {
            currentSensorData = [];
          }
          currentSensorData.push(sensorData);

          configuration.sensorData.set(key, currentSensorData);
        });
    }

    activeConfigurations.forEach(async (configuration) => {
      const publishedAt = formatISO(eventData.published_at);
      const sensorData = configuration.sensorData.get(publishedAt);
      if (sensorData) {
        this.configurations.sendEventSensorData({
          publishedAt,
          configurationId: configuration.id,
          sensorData,
        });
      }

      await configuration.save();
    });
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
    const cDevice = ConnectedDeviceHelper.findConnectedDeviceFromDevice(device, pinNr, hwAddress);

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
  private async sendConfiguration(deviceId: string, configuration: Configuration): Promise<void> {
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
