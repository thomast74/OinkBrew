import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { Model, Types } from 'mongoose';
import { Subject } from 'rxjs';

import {
  clearDatabase,
  closeDatabase,
  connectDatabase,
  getConfigurationModel,
  getDeviceModel,
} from '../../test/db-helper.fn';
import { sleep } from '../../test/helper.fn';
import { ParticleService } from '../common/particle.service';
import { ConfigurationsService } from '../configurations/configurations.service';
import { Configuration, SensorData } from '../configurations/schemas';
import {
  mockBrewArchivedForDeviceOnline,
  mockBrewNotArchived,
  mockBrewSecondForDeviceOnline,
} from '../configurations/tests/brew-configurations.mock';
import { createConfInDb } from '../configurations/tests/configuration-helper.mock';
import { DevicesEventListener } from './devices-event.listener';
import { DevicesService } from './devices.service';
import { ConnectedDeviceHelper } from './helpers';
import { Device } from './schemas';
import { ConnectedDeviceType, EventData } from './types';

describe('DevicesEventListener', () => {
  let listener: DevicesEventListener;
  let confModel: Model<Configuration>;
  let deviceModel: Model<Device>;

  let mockEventStream = new Subject<EventData>();
  const mockParticleService = {
    sendConfiguration: jest.fn(),
    updateConnectedDeviceOffset: jest.fn(),
    eventStream: jest.fn(),
  };
  mockParticleService.eventStream.mockReturnValue(mockEventStream);

  const mockDevicesService = {
    findById: jest.fn(),
    findConnectedDeviceFromDevice: jest.fn(),
    updateConnectedDeviceWithConnectStatus: jest.fn(),
  };

  const mockConfigurationsService = {
    findByDevice: jest.fn(),
    saveDocument: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const resetEventStream = () => {
    mockEventStream = new Subject<EventData>();
    mockParticleService.eventStream.mockReturnValue(mockEventStream);
  };

  let module: TestingModule;

  beforeAll(async () => {
    await connectDatabase();

    deviceModel = getDeviceModel();
    confModel = getConfigurationModel();
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        DevicesEventListener,
        ParticleService,
        DevicesService,
        ConfigurationsService,
        {
          provide: Logger,
          useValue: mockLoggerService,
        },
      ],
    })
      .overrideProvider(ParticleService)
      .useValue(mockParticleService)
      .overrideProvider(DevicesService)
      .useValue(mockDevicesService)
      .overrideProvider(ConfigurationsService)
      .useValue(mockConfigurationsService)
      .compile();
    module.useLogger(mockLoggerService);

    listener = module.get<DevicesEventListener>(DevicesEventListener);

    mockDevicesService.findById.mockReset();
    mockParticleService.eventStream.mockClear();
    mockParticleService.sendConfiguration.mockReset();
    mockParticleService.updateConnectedDeviceOffset.mockClear();
    mockLoggerService.log.mockClear();
    mockLoggerService.error.mockClear();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
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

      expect(mockParticleService.eventStream).toHaveBeenCalledTimes(2);
    });
  });

  describe('event data: oinkbrew/start', () => {
    it('should get device from event data coreid', async () => {
      const event = {
        data: 'true',
        ttl: 60,
        published_at: new Date('2022-12-09 09:34:31.056'),
        coreid: '3b003d000747343232363230',
        name: 'oinkbrew/start',
      };
      mockDevicesService.findById.mockResolvedValue(null);

      listener.onApplicationBootstrap();
      mockEventStream.next(event);
      await sleep(100);

      expect(mockDevicesService.findById).toHaveBeenCalledWith(event.coreid);
    });

    it('should send all active configurations to particle', async () => {
      const event = {
        data: 'true',
        ttl: 60,
        published_at: new Date('2022-12-09 09:34:31.056'),
        coreid: '3b003d000747343232363230',
        name: 'oinkbrew/start',
      };
      const device = {
        id: event.coreid,
        populate: jest.fn(),
        configurations: [{ ...configurationArchived }, { ...configurationNotArchived }],
      };
      mockDevicesService.findById.mockResolvedValue(device);
      device.populate.mockResolvedValue(void 0);
      mockParticleService.sendConfiguration.mockResolvedValue(void 0);

      listener.onApplicationBootstrap();
      mockEventStream.next(event);
      await sleep(100);

      expect(mockParticleService.sendConfiguration).toHaveBeenCalledTimes(1);
      expect(mockParticleService.sendConfiguration).toHaveBeenCalledWith({
        ...configurationNotArchived,
        device: {
          id: event.coreid,
        },
      });
    });

    it('should log error if device service returns error', async () => {
      const event = {
        data: 'true',
        ttl: 60,
        published_at: new Date('2022-12-09 09:34:31.056'),
        coreid: '3b003d000747343232363230',
        name: 'oinkbrew/start',
      };
      mockDevicesService.findById.mockRejectedValue('device service error');

      listener.onApplicationBootstrap();
      mockEventStream.next(event);
      await sleep(1000);

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'device service error',
        undefined,
        'DevicesEventListener1',
      );
    });

    it('should not fail of populate returns error', async () => {
      const event = {
        data: 'true',
        ttl: 60,
        published_at: new Date('2022-12-09 09:34:31.056'),
        coreid: '3b003d000747343232363230',
        name: 'oinkbrew/start',
      };
      const device = {
        id: event.coreid,
        populate: jest.fn(),
        configurations: [{ ...configurationArchived }, { ...configurationNotArchived }],
      };
      mockDevicesService.findById.mockResolvedValue(device);
      device.populate.mockRejectedValue('populate error');

      listener.onApplicationBootstrap();
      mockEventStream.next(event);
      await sleep(100);

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'populate error',
        undefined,
        'DevicesEventListener1',
      );
    });

    it('should not fail if partice returns error', async () => {
      const event = {
        data: 'true',
        ttl: 60,
        published_at: new Date('2022-12-09 09:34:31.056'),
        coreid: '3b003d000747343232363230',
        name: 'oinkbrew/start',
      };
      const device = {
        id: event.coreid,
        populate: jest.fn(),
        configurations: [
          { ...configurationArchived, archived: false },
          { ...configurationNotArchived },
        ],
      };
      mockDevicesService.findById.mockResolvedValue(device);
      device.populate.mockResolvedValue(void 0);
      mockParticleService.sendConfiguration
        .mockRejectedValueOnce('send configuration error')
        .mockResolvedValue(void 0);

      listener.onApplicationBootstrap();
      mockEventStream.next(event);
      await sleep(100);

      expect(mockParticleService.sendConfiguration).toHaveBeenCalledTimes(2);
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Send Configuration: send configuration error',
        undefined,
        'DevicesEventListener1',
      );
    });
  });

  describe('event data: oinkbrew/devices/new', () => {
    it('should call DeviceService updateConnectedDevice', async () => {
      const event = {
        data: eventConnectedDeviceString,
        ttl: 60,
        published_at: new Date('2022-12-09 09:34:31.056'),
        coreid: '3b003d000747343232363230',
        name: 'oinkbrew/devices/new',
      };

      listener.onApplicationBootstrap();
      mockEventStream.next(event);
      await sleep(1000);

      expect(mockDevicesService.updateConnectedDeviceWithConnectStatus).toHaveBeenCalledWith(
        event.coreid,
        expectedConnectedDevice,
        true,
      );
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
      mockDevicesService.findConnectedDeviceFromDevice.mockReturnValue(tempSensorWithOffset);

      listener.onApplicationBootstrap();
      mockEventStream.next(event);
      await sleep(1000);

      expect(mockParticleService.updateConnectedDeviceOffset).toHaveBeenCalledWith(
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

      expect(mockParticleService.updateConnectedDeviceOffset).not.toHaveBeenCalled();
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
      mockDevicesService.findConnectedDeviceFromDevice.mockReturnValue(tempSensorWithNoOffset);

      listener.onApplicationBootstrap();
      mockEventStream.next(event);
      await sleep(1000);

      expect(mockParticleService.updateConnectedDeviceOffset).not.toHaveBeenCalled();
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
      mockDevicesService.findConnectedDeviceFromDevice.mockReturnValue(noTempSensor);

      listener.onApplicationBootstrap();
      mockEventStream.next(event);
      await sleep(1000);

      expect(mockParticleService.updateConnectedDeviceOffset).not.toHaveBeenCalled();
    });
  });

  describe('event data: oinkbrew/devices/remove', () => {
    it('should call DeviceService updateConnectedDevice', async () => {
      const event = {
        data: eventConnectedDeviceString,
        ttl: 60,
        published_at: new Date('2022-12-09 09:34:31.056'),
        coreid: '3b003d000747343232363230',
        name: 'oinkbrew/devices/remove',
      };

      listener.onApplicationBootstrap();
      mockEventStream.next(event);
      await sleep(100);

      expect(mockDevicesService.updateConnectedDeviceWithConnectStatus).toHaveBeenCalledWith(
        event.coreid,
        expectedConnectedDevice,
        false,
      );
    });
  });

  describe('event data: oinkbrew/devices/values', () => {
    it('should add event data to active configuration', async () => {
      await createConfInDb(deviceModel, confModel, mockBrewNotArchived);
      await createConfInDb(deviceModel, confModel, mockBrewArchivedForDeviceOnline);
      const eventDate = '2022-12-09T09:35:30+01:00';
      const event = {
        data: `[
          {"pinNr": 0, "hwAddress": "2A00000000000000", "value": 20.000000},
          {"pinNr": 0, "hwAddress": "2C00000000000000", "value": 30.000000}
        ]`,
        ttl: 60,
        published_at: new Date(eventDate),
        coreid: 'ccc',
        name: 'oinkbrew/devices/values',
      };
      const expectedSensorData = new Map<string, SensorData[]>();
      expectedSensorData.set(eventDate, [
        { name: 'temp sensor name', value: 20.0, _id: expect.any(String) },
      ]);
      const activeConfigurations = await confModel.find({}).populate('device').exec();
      mockConfigurationsService.findByDevice.mockResolvedValue(activeConfigurations);

      listener.onApplicationBootstrap();
      mockEventStream.next(event);
      await sleep(100);

      const configuration = await confModel.findOne({ id: 1 }).exec();
      const sensorData = JSON.parse(JSON.stringify(configuration?.sensorData.get(eventDate)));
      expect(mockConfigurationsService.findByDevice).toHaveBeenCalledWith('ccc');
      expect(configuration?.sensorData?.size).toEqual(1);
      expect(sensorData).toEqual(expectedSensorData.get(eventDate));
    });

    it('should add event to all configration with the same connected device', async () => {
      await createConfInDb(deviceModel, confModel, mockBrewNotArchived);
      await createConfInDb(deviceModel, confModel, mockBrewSecondForDeviceOnline);
      const eventDate = '2022-12-09T09:35:30+01:00';
      const event = {
        data: `[
          {"pinNr": 0, "hwAddress": "2A00000000000000", "value": 20.000000},
          {"pinNr": 0, "hwAddress": "2C00000000000000", "value": 30.000000}
        ]`,
        ttl: 60,
        published_at: new Date(eventDate),
        coreid: 'ccc',
        name: 'oinkbrew/devices/values',
      };
      const expectedSensorData = new Map<string, SensorData[]>();
      expectedSensorData.set(eventDate, [
        { name: 'temp sensor name', value: 20.0, _id: expect.any(String) },
      ]);
      const activeConfigurations = await confModel.find({}).populate('device').exec();
      mockConfigurationsService.findByDevice.mockResolvedValue(activeConfigurations);

      listener.onApplicationBootstrap();
      mockEventStream.next(event);
      await sleep(100);

      const configuration1 = await confModel.findOne({ id: 1 }).exec();
      const sensorData1 = JSON.parse(JSON.stringify(configuration1?.sensorData.get(eventDate)));

      const configuration2 = await confModel.findOne({ id: 2 }).exec();
      const sensorData2 = JSON.parse(JSON.stringify(configuration2?.sensorData.get(eventDate)));

      expect(configuration1?.sensorData?.size).toEqual(1);
      expect(configuration2?.sensorData?.size).toEqual(1);
      expect(sensorData1).toEqual(expectedSensorData.get(eventDate));
      expect(sensorData2).toEqual(expectedSensorData.get(eventDate));
    });

    it('should not add event data to archived configurations', async () => {
      await createConfInDb(deviceModel, confModel, mockBrewNotArchived);
      await createConfInDb(deviceModel, confModel, mockBrewArchivedForDeviceOnline);
      const eventDate = '2022-12-09T09:35:30+01:00';
      const event = {
        data: `[
          {"pinNr": 0, "hwAddress": "2A00000000000000", "value": 20.000000},
          {"pinNr": 0, "hwAddress": "2C00000000000000", "value": 30.000000}
        ]`,
        ttl: 60,
        published_at: new Date(eventDate),
        coreid: 'ccc',
        name: 'oinkbrew/devices/values',
      };
      const expectedSensorData = new Map<string, SensorData[]>();
      expectedSensorData.set(eventDate, [
        { name: 'temp sensor name', value: 20.0, _id: expect.any(String) },
      ]);
      const activeConfigurations = await confModel.find({}).populate('device').exec();
      mockConfigurationsService.findByDevice.mockResolvedValue(activeConfigurations);

      listener.onApplicationBootstrap();
      mockEventStream.next(event);
      await sleep(100);

      const configuration = await confModel.findOne({ id: 2 }).exec();
      expect(configuration?.sensorData?.size).toEqual(0);
    });

    it('should not overwrite existing event data', async () => {
      await createConfInDb(deviceModel, confModel, mockBrewNotArchived);
      await createConfInDb(deviceModel, confModel, mockBrewArchivedForDeviceOnline);
      const eventDate1 = '2022-12-09T09:35:30+01:00';
      const eventDate2 = '2022-12-09T09:35:40+01:00';
      const eventData1 = `[
        {"pinNr": 0, "hwAddress": "2A00000000000000", "value": 20.000000},
        {"pinNr": 0, "hwAddress": "2C00000000000000", "value": 30.000000}
      ]`;
      const eventData2 = `[
        {"pinNr": 0, "hwAddress": "2A00000000000000", "value": 25.000000},
        {"pinNr": 0, "hwAddress": "2C00000000000000", "value": 30.000000}
      ]`;
      const event = {
        ttl: 60,
        coreid: 'ccc',
        name: 'oinkbrew/devices/values',
      };
      const activeConfigurations = await confModel.find({}).populate('device').exec();
      mockConfigurationsService.findByDevice.mockResolvedValue(activeConfigurations);

      listener.onApplicationBootstrap();
      mockEventStream.next({ ...event, data: eventData1, published_at: new Date(eventDate1) });
      await sleep(100);
      mockEventStream.next({ ...event, data: eventData2, published_at: new Date(eventDate2) });
      await sleep(100);

      const configuration = await confModel.findOne({ id: 1 }).exec();
      const sensorData1 = JSON.parse(JSON.stringify(configuration?.sensorData.get(eventDate1)));
      const sensorData2 = JSON.parse(JSON.stringify(configuration?.sensorData.get(eventDate2)));

      expect(configuration?.sensorData?.size).toEqual(2);
      expect(sensorData1[0].value).toEqual(20);
      expect(sensorData2[0].value).toEqual(25);
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
  pinNr: 13,
  hwAddress: '000000000001',
  name: undefined,
  offset: 0.8,
  deviceOffset: 0.0,
  connected: false,
});

const tempSensorWithNoOffset = ConnectedDeviceHelper.parseData({
  type: ConnectedDeviceType.ONEWIRE_TEMP,
  pinNr: 14,
  hwAddress: '000000000002',
  name: undefined,
  offset: 0.0,
  deviceOffset: 0.0,
  connected: true,
});

const noTempSensor = ConnectedDeviceHelper.parseData({
  type: ConnectedDeviceType.ACTUATOR_DIGITAL,
  pinNr: 15,
  hwAddress: '000000000003',
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

const configurationArchived = {
  id: 1,
  archived: true,
};
const configurationNotArchived = {
  id: 2,
  archived: false,
};
