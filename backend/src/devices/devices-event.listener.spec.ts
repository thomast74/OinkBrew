import { Test, TestingModule } from '@nestjs/testing';
import { Subject } from 'rxjs';
import { sleep } from '../../test/helper.fn';
import { ParticleService } from '../common/particle.service';
import { DevicesEventListener } from './devices-event.listener';
import { DevicesService } from './devices.service';
import { EventData } from './types';

describe('DevicesEventListener', () => {
  let module: TestingModule;
  let listener: DevicesEventListener;

  let mockEventStream = new Subject<EventData>();
  const mockParticleService = {
    eventStream: jest.fn(),
  };
  mockParticleService.eventStream.mockReturnValue(mockEventStream);

  const mockDevicesService = {
    updateConnectedDeviceWithConnectStatus: jest.fn(),
  };

  const resetEventStream = () => {
    mockEventStream = new Subject<EventData>();
    mockParticleService.eventStream.mockReturnValue(mockEventStream);
  };

  beforeEach(async () => {
    mockParticleService.eventStream.mockClear();

    module = await Test.createTestingModule({
      providers: [DevicesEventListener, ParticleService, DevicesService],
    })
      .overrideProvider(ParticleService)
      .useValue(mockParticleService)
      .overrideProvider(DevicesService)
      .useValue(mockDevicesService)
      .compile();

    listener = module.get<DevicesEventListener>(DevicesEventListener);
  });

  afterAll(async () => await module.close());

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
  offset: 0.0,
  deviceOffset: 0.0,
};