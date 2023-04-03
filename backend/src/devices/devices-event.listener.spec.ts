import { Test } from '@nestjs/testing';

import { Subject } from 'rxjs';

import { sleep } from '../../test/helper.fn';
import { ParticleService } from '../common/particle.service';
import { DevicesEventListener } from './devices-event.listener';
import { DevicesService } from './devices.service';
import { ConnectedDeviceHelper } from './helpers';
import { Device } from './schemas';
import { ConnectedDeviceType, EventData } from './types';

describe('DevicesEventListener', () => {
  let listener: DevicesEventListener;

  let mockEventStream = new Subject<EventData>();
  const mockParticleService = {
    updateConnectedDeviceOffset: jest.fn(),
    eventStream: jest.fn(),
  };
  mockParticleService.eventStream.mockReturnValue(mockEventStream);

  const mockDevicesService = {
    findConnectedDeviceFromDevice: jest.fn(),
    updateConnectedDeviceWithConnectStatus: jest.fn(),
  };

  const resetEventStream = () => {
    mockEventStream = new Subject<EventData>();
    mockParticleService.eventStream.mockReturnValue(mockEventStream);
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [DevicesEventListener, ParticleService, DevicesService],
    })
      .overrideProvider(ParticleService)
      .useValue(mockParticleService)
      .overrideProvider(DevicesService)
      .useValue(mockDevicesService)
      .compile();

    listener = module.get<DevicesEventListener>(DevicesEventListener);

    mockParticleService.eventStream.mockClear();
    mockParticleService.updateConnectedDeviceOffset.mockClear();
  });

  describe('onApplicationBootstrap', () => {
    it('should start listening to particle event stream', () => {
      listener.onApplicationBootstrap();

      expect(mockParticleService.eventStream).toHaveBeenCalledTimes(1);
    });

    it('should retry 3 times listening in case of error', async () => {
      listener.onApplicationBootstrap();
      mockEventStream.error('Faulty');
      resetEventStream();
      await sleep(3000);

      expect(mockParticleService.eventStream).toHaveBeenCalledTimes(3);
    });
  });

  describe('event data: oinkbrew/devices/new', () => {
    it('should call DeviceService updateConnectedDevice', () => {
      const event = {
        data: eventConnectedDeviceString,
        ttl: 60,
        published_at: new Date('2022-12-09 09:34:31.056'),
        coreid: '3b003d000747343232363230',
        name: 'oinkbrew/devices/new',
      };
      listener.onApplicationBootstrap();
      mockEventStream.next(event);

      expect(
        mockDevicesService.updateConnectedDeviceWithConnectStatus,
      ).toHaveBeenCalledWith(event.coreid, expectedConnectedDevice, true);
    });

    it('should send offset to Particle if sensor is connected and a Temp Sensor', async () => {
      const event = {
        data: JSON.stringify(tempSensorWithOffset),
        ttl: 60,
        published_at: new Date('2022-12-09 09:34:31.056'),
        coreid: '3b003d000747343232363230',
        name: 'oinkbrew/devices/new',
      };
      mockDevicesService.updateConnectedDeviceWithConnectStatus.mockResolvedValue(
        deviceWithTempSensorAndOffset,
      );
      mockDevicesService.findConnectedDeviceFromDevice.mockReturnValue(
        tempSensorWithOffset,
      );

      listener.onApplicationBootstrap();
      mockEventStream.next(event);
      await sleep(1000);

      expect(
        mockParticleService.updateConnectedDeviceOffset,
      ).toHaveBeenCalledWith(
        deviceWithTempSensorAndOffset.id,
        tempSensorWithOffset.pinNr,
        tempSensorWithOffset.hwAddress,
        tempSensorWithOffset.offset,
      );
    });

    it('should not send offset to Particle if sensor is not connected and a Temp Sensor', async () => {
      const event = {
        data: JSON.stringify(tempSensorWithOffsetAndNotConnected),
        ttl: 60,
        published_at: new Date('2022-12-09 09:34:31.056'),
        coreid: '3b003d000747343232363230',
        name: 'oinkbrew/devices/new',
      };
      mockDevicesService.updateConnectedDeviceWithConnectStatus.mockResolvedValue(
        deviceWithTempSensorAndOffsetAndNotConnected,
      );
      mockDevicesService.findConnectedDeviceFromDevice.mockReturnValue(
        tempSensorWithOffsetAndNotConnected,
      );

      listener.onApplicationBootstrap();
      mockEventStream.next(event);
      await sleep(1000);

      expect(
        mockParticleService.updateConnectedDeviceOffset,
      ).not.toHaveBeenCalled();
    });

    it('should not send offset to Particle if sensorhas offset of 0', async () => {
      const event = {
        data: JSON.stringify(tempSensorWithNoOffset),
        ttl: 60,
        published_at: new Date('2022-12-09 09:34:31.056'),
        coreid: '3b003d000747343232363230',
        name: 'oinkbrew/devices/new',
      };
      mockDevicesService.updateConnectedDeviceWithConnectStatus.mockResolvedValue(
        deviceWithTempSensorAndNoOffset,
      );
      mockDevicesService.findConnectedDeviceFromDevice.mockReturnValue(
        tempSensorWithNoOffset,
      );

      listener.onApplicationBootstrap();
      mockEventStream.next(event);
      await sleep(1000);

      expect(
        mockParticleService.updateConnectedDeviceOffset,
      ).not.toHaveBeenCalled();
    });

    it('should not send offset to Particle if sensor if not temp sensor', async () => {
      const event = {
        data: JSON.stringify(noTempSensor),
        ttl: 60,
        published_at: new Date('2022-12-09 09:34:31.056'),
        coreid: '3b003d000747343232363230',
        name: 'oinkbrew/devices/new',
      };
      mockDevicesService.updateConnectedDeviceWithConnectStatus.mockResolvedValue(
        deviceWithNoTempSensor,
      );
      mockDevicesService.findConnectedDeviceFromDevice.mockReturnValue(
        noTempSensor,
      );

      listener.onApplicationBootstrap();
      mockEventStream.next(event);
      await sleep(1000);

      expect(
        mockParticleService.updateConnectedDeviceOffset,
      ).not.toHaveBeenCalled();
    });
  });

  describe('event data: oinkbrew/devices/remove', () => {
    it('should call DeviceService updateConnectedDevice', () => {
      const event = {
        data: eventConnectedDeviceString,
        ttl: 60,
        published_at: new Date('2022-12-09 09:34:31.056'),
        coreid: '3b003d000747343232363230',
        name: 'oinkbrew/devices/remove',
      };
      listener.onApplicationBootstrap();
      mockEventStream.next(event);

      expect(
        mockDevicesService.updateConnectedDeviceWithConnectStatus,
      ).toHaveBeenCalledWith(event.coreid, expectedConnectedDevice, false);
    });
  });
});

const eventConnectedDevice = {
  type: 1,
  pinNr: 17,
  hwAddress: '0000000000000000',
  offset: 0.0,
  deviceOffset: 0.0,
};
const eventConnectedDeviceString = JSON.stringify(eventConnectedDevice);
const expectedConnectedDevice = {
  ...eventConnectedDevice,
  connected: false,
  name: null,
  offset: 0.0,
  deviceOffset: 0.0,
};

const tempSensorWithOffset = ConnectedDeviceHelper.parseData({
  type: ConnectedDeviceType.ONEWIRE_TEMP,
  pinNr: 12,
  hwAddress: '000000000000',
  name: undefined,
  offset: 0.8,
  deviceOffset: 0.0,
  connected: true,
});

const tempSensorWithOffsetAndNotConnected = ConnectedDeviceHelper.parseData({
  type: ConnectedDeviceType.ONEWIRE_TEMP,
  pinNr: 12,
  hwAddress: '000000000000',
  name: undefined,
  offset: 0.8,
  deviceOffset: 0.0,
  connected: false,
});

const tempSensorWithNoOffset = ConnectedDeviceHelper.parseData({
  type: ConnectedDeviceType.ONEWIRE_TEMP,
  pinNr: 12,
  hwAddress: '000000000000',
  name: undefined,
  offset: 0.0,
  deviceOffset: 0.0,
  connected: true,
});

const noTempSensor = ConnectedDeviceHelper.parseData({
  type: ConnectedDeviceType.ACTUATOR_DIGITAL,
  pinNr: 12,
  hwAddress: '000000000000',
  name: undefined,
  offset: 0.0,
  deviceOffset: 0.0,
  connected: true,
});

const deviceWithTempSensorAndOffset = {
  id: 'bbb',
  connectedDevices: [{ ...tempSensorWithOffset }],
} as Device;

const deviceWithTempSensorAndOffsetAndNotConnected = {
  id: 'bbb',
  connectedDevices: [{ ...tempSensorWithOffsetAndNotConnected }],
} as Device;

const deviceWithTempSensorAndNoOffset = {
  id: 'bbb',
  connectedDevices: [{ ...tempSensorWithNoOffset }],
} as Device;

const deviceWithNoTempSensor = {
  id: 'bbb',
  connectedDevices: [{ ...noTempSensor }],
} as Device;
