import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { formatISO } from 'date-fns';
import { Model } from 'mongoose';
import { take } from 'rxjs';

import {
  clearDatabase,
  clearDatabaseCollections,
  closeDatabase,
  connectDatabase,
  disconnectDatabase,
  getConfigurationModel,
  getDeviceModel,
} from '../../test/db-helper.fn';
import { sleep } from '../../test/helper.fn';
import { ParticleService } from '../common/particle.service';
import { DevicesService } from '../devices/devices.service';
import { Device, DeviceDocument } from '../devices/schemas';
import { createDeviceInDb } from '../devices/tests/devices-helper.mock';
import {
  mockDeviceForConfOffline,
  mockDeviceOffline,
  mockDeviceOnline,
  mockDeviceOnlineNotUsed,
} from '../devices/tests/devices.mock';
import { ConfigurationsService } from './configurations.service';
import { Configuration, EventSensorData } from './schemas';
import {
  mockBrewArchived,
  mockBrewNotArchived,
  mockDtoBrewGood,
  mockDtoBrewMissingDevice,
  mockDtoBrewUpdate,
} from './tests/brew-configurations.mock';
import { createConfFromDto, createConfInDb } from './tests/configuration-helper.mock';
import { mockFridgeNotArchived } from './tests/fridge-configurations.mock';

describe('ConfigurationsService', () => {
  let service: ConfigurationsService;
  let confModel: Model<Configuration>;
  let deviceModel: Model<Device>;

  const mockDeviceSvc = {
    findById: jest.fn(),
    findConnectedDeviceFromDevice: jest.fn(),
  };

  const mockParticleService = {
    sendConfiguration: jest.fn(),
    removeConfiguration: jest.fn(),
    deleteConfiguration: jest.fn(),
  };

  beforeAll(async () => {
    await connectDatabase();

    deviceModel = getDeviceModel();
    confModel = getConfigurationModel();

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationsService,
        ParticleService,
        {
          provide: getModelToken(Configuration.name),
          useValue: confModel,
        },
        {
          provide: getModelToken(Device.name),
          useValue: deviceModel,
        },
        {
          provide: DevicesService,
          useValue: mockDeviceSvc,
        },
        {
          provide: ParticleService,
          useValue: mockParticleService,
        },
      ],
    }).compile();

    service = app.get<ConfigurationsService>(ConfigurationsService);
  });

  beforeEach(async () => {
    mockParticleService.sendConfiguration.mockReset();
    mockParticleService.deleteConfiguration.mockReset();
    await connectDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should call db to get all active configurations', async () => {
      await createConfInDb(deviceModel, confModel, mockBrewNotArchived);
      await createConfInDb(deviceModel, confModel, mockBrewArchived);
      await createConfInDb(deviceModel, confModel, mockFridgeNotArchived);

      const response = await service.findAll(false);

      expect(response).toHaveLength(2);
      expect(response[0].name).toEqual('aaa');
      expect(response[1].name).toEqual('ccc');
    });

    it('should call prisma to get all archived configurations', async () => {
      await createConfInDb(deviceModel, confModel, mockBrewNotArchived);
      await createConfInDb(deviceModel, confModel, mockBrewArchived);
      await createConfInDb(deviceModel, confModel, mockFridgeNotArchived);

      const response = await service.findAll(true);

      expect(response).toHaveLength(1);
      expect(response[0].name).toEqual('bbb');
    });

    it('should return empty array in case no configurations found', async () => {
      await createConfInDb(deviceModel, confModel, mockBrewNotArchived);
      await createConfInDb(deviceModel, confModel, mockFridgeNotArchived);

      const response = await service.findAll(true);

      expect(response).toHaveLength(0);
    });

    it('should return empty array in case mongo error', async () => {
      await clearDatabaseCollections();

      const response = await service.findAll(false);

      expect(response).toHaveLength(0);
    });
  });

  describe('findByDevice', () => {
    it('should call db to get all configurations assigned to device', async () => {
      await createConfInDb(deviceModel, confModel, mockBrewNotArchived);
      await createConfInDb(deviceModel, confModel, mockBrewArchived);
      await createConfInDb(deviceModel, confModel, mockFridgeNotArchived);

      const response = await service.findByDevice('ccc');

      expect(response).toHaveLength(2);
      expect(response[0].name).toEqual('aaa');
      expect(response[1].name).toEqual('ccc');
    });

    it('should return empty array in case no device found', async () => {
      await createConfInDb(deviceModel, confModel, mockBrewNotArchived);
      await createConfInDb(deviceModel, confModel, mockFridgeNotArchived);

      const response = await service.findByDevice('ZZZ');

      expect(response).toHaveLength(0);
    });

    it('should return empty array in case no configuration found', async () => {
      await createConfInDb(deviceModel, confModel, mockBrewNotArchived);
      await createDeviceInDb(deviceModel, mockDeviceOnlineNotUsed);

      const response = await service.findByDevice('www');

      expect(response).toHaveLength(0);
    });

    it('should return empty array in case mongo error', async () => {
      await clearDatabaseCollections();

      const response = await service.findByDevice('ZZZ');

      expect(response).toHaveLength(0);
    });
  });

  describe('save', () => {
    it('should return NotFoundException if provided device not found', async () => {
      mockDeviceSvc.findById.mockRejectedValue(new NotFoundException('Device not found'));

      await expect(service.save(mockDtoBrewMissingDevice)).rejects.toEqual(
        new NotFoundException('Device not found'),
      );
    });

    it('should return BadRequestException if one of connected devices are not assocatiated with found device', async () => {
      const device = await createDeviceInDb(deviceModel, mockDeviceOnline);
      mockDeviceSvc.findById.mockResolvedValue(device);
      mockDeviceSvc.findConnectedDeviceFromDevice();
      const confDto = {
        ...mockDtoBrewMissingDevice,
        deviceId: 'ccc',
      };

      await expect(service.save(confDto)).rejects.toEqual(
        new NotFoundException(`Connected Device not found: 0/MISSING000000000`),
      );
    });

    it('should return InternalServiceExcpetion if saving configuration errors', async () => {
      const device = await createDeviceInDb(deviceModel, mockDeviceOnline);
      mockDeviceSvc.findById.mockResolvedValue(device);
      mockDeviceSvc.findConnectedDeviceFromDevice();
      await closeDatabase();

      await expect(service.save(mockDtoBrewGood)).rejects.toEqual(
        new InternalServerErrorException('Client must be connected before running operations'),
      );
    });

    it('should create configuration in database', async () => {
      const device = await createDeviceInDb(deviceModel, mockDeviceOnline);
      mockDeviceSvc.findById.mockResolvedValue(device);
      mockDeviceSvc.findConnectedDeviceFromDevice();

      await service.save(mockDtoBrewGood);

      const dbConf = await confModel.findOne({ id: mockDtoBrewGood.id }).populate('device').exec();
      expect(dbConf).not.toBeNull();
      expect((dbConf?.device as DeviceDocument).toObject()).toMatchObject({
        ...device?.toObject(),
        __v: expect.any(Number),
        configurations: [dbConf!._id],
      });
    });

    it('should create configuration with max id if not provided', async () => {
      const confDto = { ...mockDtoBrewGood };
      const device = await createDeviceInDb(deviceModel, mockDeviceOnline);
      mockDeviceSvc.findById.mockResolvedValue(device);
      mockDeviceSvc.findConnectedDeviceFromDevice();

      delete confDto.id;

      await service.save(confDto);

      const dbConf = await confModel.findOne({ id: 1 }).exec();
      expect(dbConf).not.toBeNull();
    });

    it('should return configuration document if successful', async () => {
      const device = await createDeviceInDb(deviceModel, mockDeviceOnline);
      mockDeviceSvc.findById.mockResolvedValue(device);
      mockDeviceSvc.findConnectedDeviceFromDevice();

      const newConfiguration = await service.save(mockDtoBrewGood);

      const dbConf = await confModel.findOne({ id: mockDtoBrewGood.id }).populate('device').exec();

      expect(newConfiguration.toObject()).toEqual({
        ...dbConf?.toObject(),
        device: {
          ...(dbConf?.device as any).toObject(),
          configurations: [],
        },
      });
    });

    it('should update configuration in database', async () => {
      const updateConfiguration = { ...mockDtoBrewGood };
      const device = await createDeviceInDb(deviceModel, mockDeviceOnline);
      await createConfFromDto(deviceModel, confModel, mockDtoBrewUpdate);
      mockDeviceSvc.findById.mockResolvedValue(device);
      mockDeviceSvc.findConnectedDeviceFromDevice();

      updateConfiguration.name = 'new conf name';
      updateConfiguration.p = 5;
      updateConfiguration.i = 6;
      updateConfiguration.d = 7;

      await service.save(updateConfiguration);

      const dbConf = await confModel.findOne({ id: mockDtoBrewGood.id }).populate('device').exec();
      expect(dbConf?.name).toEqual('new conf name');
      expect(dbConf?.p).toEqual(5);
      expect(dbConf?.i).toEqual(6);
      expect(dbConf?.d).toEqual(7);
    });

    it('should send new configuration to Particle if device is online', async () => {
      const device = await createDeviceInDb(deviceModel, mockDeviceOnline);
      mockDeviceSvc.findById.mockResolvedValue(device);
      mockDeviceSvc.findConnectedDeviceFromDevice();

      const newConf = await service.save(mockDtoBrewGood);

      expect(mockParticleService.sendConfiguration).toHaveBeenCalledWith(newConf);
    });

    it('should not send new configuration to Particle if device is offline', async () => {
      const device = await createDeviceInDb(deviceModel, mockDeviceForConfOffline);
      mockDeviceSvc.findById.mockResolvedValue(device);
      mockDeviceSvc.findConnectedDeviceFromDevice();

      await service.save(mockDtoBrewGood);

      expect(mockParticleService.sendConfiguration).not.toHaveBeenCalled();
    });

    it('should return InternalServerException if particle service update fails', async () => {
      const device = await createDeviceInDb(deviceModel, mockDeviceOnline);
      mockDeviceSvc.findById.mockResolvedValue(device);
      mockDeviceSvc.findConnectedDeviceFromDevice();
      mockParticleService.sendConfiguration.mockRejectedValue(new Error('particle failed'));

      await expect(service.save(mockDtoBrewGood)).rejects.toEqual(
        new InternalServerErrorException('particle failed'),
      );
    });
  });

  describe('update', () => {
    it('should return NotFoundException if configuration with id not found', async () => {
      const updateConfiguration = { ...mockDtoBrewMissingDevice };
      updateConfiguration.id = 22;

      await expect(service.update(22, updateConfiguration)).rejects.toEqual(
        new NotFoundException('Configuration not found'),
      );
    });

    it('should return NotFoundException if provided device not found', async () => {
      const updateConfiguration = { ...mockDtoBrewGood };
      await createDeviceInDb(deviceModel, mockDeviceOnline);
      await createConfFromDto(deviceModel, confModel, mockDtoBrewUpdate);
      updateConfiguration.deviceId = 'not known';

      mockDeviceSvc.findById.mockRejectedValue(new NotFoundException('Device not found'));

      await expect(service.update(2, updateConfiguration)).rejects.toEqual(
        new NotFoundException('Device not found'),
      );
    });

    it('should return BadRequestException if one of connected devices are not assocatiated with found device', async () => {
      const device = await createDeviceInDb(deviceModel, mockDeviceOnline);
      await createConfFromDto(deviceModel, confModel, mockDtoBrewUpdate);
      mockDeviceSvc.findById.mockResolvedValue(device);
      mockDeviceSvc.findConnectedDeviceFromDevice();
      const updatedConfiguration = {
        ...mockDtoBrewMissingDevice,
        deviceId: 'ccc',
      };

      await expect(service.update(2, updatedConfiguration)).rejects.toEqual(
        new NotFoundException(`Connected Device not found: 0/MISSING000000000`),
      );
    });

    it('should return InternalServiceExcpetion if saving configuration errors', async () => {
      const device = await createDeviceInDb(deviceModel, mockDeviceOnline);
      await createConfFromDto(deviceModel, confModel, mockDtoBrewUpdate);
      mockDeviceSvc.findById.mockResolvedValue(device);
      mockDeviceSvc.findConnectedDeviceFromDevice();
      await closeDatabase();

      await expect(service.update(2, mockDtoBrewGood)).rejects.toEqual(
        new InternalServerErrorException('Client must be connected before running operations'),
      );
    });

    it('should update configuration in database', async () => {
      const updateConfiguration = { ...mockDtoBrewGood };
      const device = await createDeviceInDb(deviceModel, mockDeviceOnline);
      await createConfFromDto(deviceModel, confModel, mockDtoBrewUpdate);
      mockDeviceSvc.findById.mockResolvedValue(device);
      mockDeviceSvc.findConnectedDeviceFromDevice();

      updateConfiguration.name = 'new conf name';
      updateConfiguration.p = 5;
      updateConfiguration.i = 6;
      updateConfiguration.d = 7;

      await service.update(2, updateConfiguration);

      const dbConf = await confModel
        .findOne({ id: mockDtoBrewUpdate.id })
        .populate('device')
        .exec();
      expect(dbConf?.name).toEqual('new conf name');
      expect(dbConf?.p).toEqual(5);
      expect(dbConf?.i).toEqual(6);
      expect(dbConf?.d).toEqual(7);
    });

    it('should return configuration document if successful', async () => {
      const updateConfiguration = { ...mockDtoBrewGood };
      const device = await createDeviceInDb(deviceModel, mockDeviceOnline);
      await createConfFromDto(deviceModel, confModel, mockDtoBrewUpdate);
      mockDeviceSvc.findById.mockResolvedValue(device);
      mockDeviceSvc.findConnectedDeviceFromDevice();

      updateConfiguration.name = 'new conf name';
      updateConfiguration.p = 5;
      updateConfiguration.i = 6;
      updateConfiguration.d = 7;

      const newConfiguration = await service.update(2, updateConfiguration);

      const dbConf = await confModel.findOne({ id: 2 }).populate('device').exec();

      expect(newConfiguration.toObject()).toEqual({
        ...dbConf?.toObject(),
        device: {
          ...(dbConf?.device as any).toObject(),
          configurations: [],
        },
      });
    });

    it('should send new configuration to Particle if device is online', async () => {
      const updateConfiguration = { ...mockDtoBrewGood };
      const device = await createDeviceInDb(deviceModel, mockDeviceOnline);
      await createConfFromDto(deviceModel, confModel, mockDtoBrewUpdate);
      mockDeviceSvc.findById.mockResolvedValue(device);
      mockDeviceSvc.findConnectedDeviceFromDevice();

      const newConf = await service.update(2, updateConfiguration);

      expect(mockParticleService.sendConfiguration).toHaveBeenCalledWith(newConf);
    });

    it('should not send new configuration to Particle if device is offline', async () => {
      const updateConfiguration = { ...mockDtoBrewGood };
      const device = await createDeviceInDb(deviceModel, mockDeviceForConfOffline);
      await createConfFromDto(deviceModel, confModel, mockDtoBrewUpdate);
      mockDeviceSvc.findById.mockResolvedValue(device);
      mockDeviceSvc.findConnectedDeviceFromDevice();

      await service.update(2, updateConfiguration);

      expect(mockParticleService.sendConfiguration).not.toHaveBeenCalled();
    });

    it('should return InternalServerException if particle service update fails', async () => {
      const updateConfiguration = { ...mockDtoBrewGood };
      const device = await createDeviceInDb(deviceModel, mockDeviceOnline);
      await createConfFromDto(deviceModel, confModel, mockDtoBrewUpdate);
      mockDeviceSvc.findById.mockResolvedValue(device);
      mockDeviceSvc.findConnectedDeviceFromDevice();
      mockParticleService.sendConfiguration.mockRejectedValue(new Error('particle failed'));

      await expect(service.update(2, updateConfiguration)).rejects.toEqual(
        new InternalServerErrorException('particle failed'),
      );
    });
  });

  describe('delete', () => {
    it('should return NotFoundException if configuration with id not found', async () => {
      await expect(service.delete(22)).rejects.toEqual(
        new NotFoundException('Configuration not found'),
      );
    });

    it('should return InternalServerErrorException if database has errors', async () => {
      await disconnectDatabase();

      await expect(service.delete(22)).rejects.toEqual(
        new InternalServerErrorException('Client must be connected before running operations'),
      );
    });

    it('should archive configuration in database', async () => {
      const conf = { ...mockDtoBrewUpdate, deviceId: 'ddd' };
      const device = await createDeviceInDb(deviceModel, mockDeviceOffline);
      await createConfFromDto(deviceModel, confModel, conf);
      mockDeviceSvc.findById.mockResolvedValue(device);
      mockDeviceSvc.findConnectedDeviceFromDevice();

      await service.delete(2);

      const dbConf = await confModel.findOne({ id: 2 }).populate('device').exec();
      expect(dbConf?.archived).toBeTrue();
    });

    it('should remove configuration from Particle if device is online', async () => {
      const device = await createDeviceInDb(deviceModel, mockDeviceOnline);
      await createConfFromDto(deviceModel, confModel, mockDtoBrewUpdate);
      mockDeviceSvc.findById.mockResolvedValue(device);
      mockDeviceSvc.findConnectedDeviceFromDevice();

      await service.delete(2);

      expect(mockParticleService.deleteConfiguration).toHaveBeenCalled();
    });

    it('should not send remove configuration to Particle if device is offline', async () => {
      const device = await createDeviceInDb(deviceModel, mockDeviceForConfOffline);
      await createConfFromDto(deviceModel, confModel, mockDtoBrewUpdate);
      mockDeviceSvc.findById.mockResolvedValue(device);
      mockDeviceSvc.findConnectedDeviceFromDevice();

      await service.delete(2);

      expect(mockParticleService.deleteConfiguration).not.toHaveBeenCalled();
    });

    it('should return InternalServerException if particle service update fails', async () => {
      const device = await createDeviceInDb(deviceModel, mockDeviceOnline);
      await createConfFromDto(deviceModel, confModel, mockDtoBrewUpdate);
      mockDeviceSvc.findById.mockResolvedValue(device);
      mockDeviceSvc.findConnectedDeviceFromDevice();

      mockParticleService.deleteConfiguration.mockRejectedValue(new Error('particle failed'));

      await expect(service.delete(2)).rejects.toEqual(
        new InternalServerErrorException('particle failed'),
      );
    });
  });

  describe('eventSensorData', () => {
    it('should receive event sensor data when new one is send', async () => {
      const sensorData: EventSensorData = {
        publishedAt: formatISO(new Date()),
        configurationId: 2,
        sensorData: [{ name: 'temp sensor 1', value: 23.34 }],
      };
      let recvSensorData: EventSensorData | undefined = undefined;

      const subsription = service.getEventSensorData(2).subscribe({
        next: (sensorData) => (recvSensorData = sensorData),
      });
      service.sendEventSensorData(sensorData);
      await sleep(10);

      expect(recvSensorData).toEqual(sensorData);

      subsription.unsubscribe();
    });

    it('should receive event sensor data when new one is send', async () => {
      const publishedAt = formatISO(new Date());
      const sensorData = [{ name: 'temp sensor 1', value: 23.34 }];
      const sensorData1: EventSensorData = { publishedAt, configurationId: 1, sensorData };
      const sensorData2: EventSensorData = { publishedAt, configurationId: 2, sensorData };
      const recvSensorData: EventSensorData[] = [];

      const subscription = service.getEventSensorData(2).subscribe({
        next: (sensorData) => {
          recvSensorData.push(sensorData);
        },
      });
      service.sendEventSensorData(sensorData1);
      service.sendEventSensorData(sensorData2);
      await sleep(100);

      expect(recvSensorData).toHaveLength(1);
      expect(recvSensorData[0]).toEqual(sensorData2);

      subscription.unsubscribe();
    });
  });
});
