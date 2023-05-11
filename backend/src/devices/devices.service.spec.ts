import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';

import { Model } from 'mongoose';

import {
  clearDatabase,
  closeDatabase,
  connectDatabase,
  getDeviceModel,
} from '../../test/db-helper.fn';
import { ParticleService } from '../common/particle.service';
import { DevicesService } from './devices.service';
import { ConnectedDevice, Device } from './schemas';
import { createDeviceInDb } from './tests/devices-helper.mock';
import {
  mockDeviceOffline,
  mockDeviceOfflineWithConnectedDevice,
  mockDeviceOfflineWithConnectedDeviceConnected,
  mockDeviceOnline,
  mockDeviceOnlineWithConnectedDevice,
  newConnectedDevice,
} from './tests/devices.mock';
import { ConnectedDeviceType } from './types';

describe('DevicesService', () => {
  let service: DevicesService;
  let deviceModel: Model<Device>;

  const mockParticleService = {
    updateDevice: jest.fn(),
    updateConnectedDeviceOffset: jest.fn(),
    restart: jest.fn(),
  };

  beforeAll(async () => {
    await connectDatabase();

    deviceModel = getDeviceModel();

    const app = await Test.createTestingModule({
      providers: [
        DevicesService,
        { provide: getModelToken(Device.name), useValue: deviceModel },
        { provide: ParticleService, useValue: mockParticleService },
      ],
    }).compile();

    service = app.get<DevicesService>(DevicesService);
  });

  beforeEach(async () => {
    await connectDatabase();

    mockParticleService.updateDevice.mockReset();
    mockParticleService.updateConnectedDeviceOffset.mockReset();
    mockParticleService.restart.mockReset();
    mockParticleService.updateDevice.mockResolvedValue({
      isSuccessful: true,
    });
    mockParticleService.updateConnectedDeviceOffset.mockResolvedValue({
      isSuccessful: true,
    });
    mockParticleService.restart.mockResolvedValue({
      isSuccessful: true,
    });
  });

  afterEach(async () => {
    jest.restoreAllMocks();

    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return found devices', async () => {
      const expectedDevice1 = await createDeviceInDb(
        deviceModel,
        mockDeviceOnline,
      );
      const expectedDevice2 = await createDeviceInDb(
        deviceModel,
        mockDeviceOffline,
      );

      const receivedDevices = await service.findAll();

      expect(receivedDevices).toEqual([expectedDevice1, expectedDevice2]);
    });

    it('should return error from prisma client', async () => {
      await createDeviceInDb(deviceModel, mockDeviceOnline);
      await closeDatabase();

      const response = await service.findAll();

      await expect(response).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return found device', async () => {
      const expectedDevice = await createDeviceInDb(
        deviceModel,
        mockDeviceOffline,
      );
      await createDeviceInDb(deviceModel, mockDeviceOnline);

      const device = await service.findById(mockDeviceOffline.id);

      expect(device).toEqual(expectedDevice);
    });

    it('should return NotFoundException if device was not found', async () => {
      await createDeviceInDb(deviceModel, mockDeviceOnline);

      await expect(service.findById(mockDeviceOffline.id)).rejects.toEqual(
        new NotFoundException('Device not found'),
      );
    });

    it('should return InternalServerErrorException in case of error', async () => {
      await closeDatabase();

      await expect(service.findById('aaa')).rejects.toEqual(
        new InternalServerErrorException(
          'Client must be connected before running operations',
        ),
      );
    });
  });

  describe('update', () => {
    it('should return NotFoundException when no device found', async () => {
      await expect(service.update('aaa', 'bbb', 'ccc')).rejects.toEqual(
        new NotFoundException('Device not found'),
      );
    });

    it('should save updated device to database', async () => {
      const newDevice = {
        ...(await createDeviceInDb(deviceModel, mockDeviceOffline))?.toObject(),
        name: 'new name',
        notes: 'my notes',
      };

      await service.update('ddd', 'new name', 'my notes');

      const dbDevice = (
        await deviceModel.findOne({ id: mockDeviceOffline.id }).exec()
      )?.toObject();

      expect(dbDevice).toBeDefined();
      expect(dbDevice).toEqual(newDevice);
    });

    it('should call ParticleService to update name and notes', async () => {
      await createDeviceInDb(deviceModel, mockDeviceOnline);

      await service.update(mockDeviceOnline.id, 'new name', 'my notes');

      expect(mockParticleService.updateDevice).toHaveBeenCalledWith(
        mockDeviceOnline.id,
        'new name',
        'my notes',
      );
    });

    it('should return internal server error when particle update fails', async () => {
      await createDeviceInDb(deviceModel, mockDeviceOnline);

      mockParticleService.updateDevice.mockResolvedValue({
        isSuccessful: false,
        errorCode: 403,
        info: 'Particle device update failed',
      });

      await expect(
        service.update(mockDeviceOnline.id, 'new name', 'my notes'),
      ).rejects.toEqual(
        new InternalServerErrorException('403: Particle device update failed'),
      );
    });
  });

  describe('save', () => {
    it('should call save new device if not already in database', async () => {
      const expectedDevice = { ...mockDeviceOnline };

      await service.save(expectedDevice);

      const dbDevice = (
        await deviceModel.findOne({ id: mockDeviceOnline.id }).exec()
      )?.toObject();

      expect(dbDevice).toBeDefined();
      expect(dbDevice).toMatchObject(mockDeviceOnline);
    });

    it('should call update device if already in database', async () => {
      const expectedDevice = { ...mockDeviceOnline };
      await createDeviceInDb(deviceModel, expectedDevice);
      expectedDevice.name = 'new device name';

      await service.save(expectedDevice);

      const dbDevice = (
        await deviceModel.findOne({ id: expectedDevice.id }).exec()
      )?.toObject();

      expect(dbDevice).toBeDefined();
      expect(dbDevice).toMatchObject(expectedDevice);
    });

    it('should return error in case of database error', async () => {
      await closeDatabase();

      await expect(service.save(mockDeviceOnline)).rejects.toEqual(
        new InternalServerErrorException(
          'Client must be connected before running operations',
        ),
      );
    });
  });

  describe('addConnectedDeviceWithConnectStatus', () => {
    it('should return NotFoundException if device top update was not found', async () => {
      const expectedConnectedDevice = {
        type: ConnectedDeviceType.ACTUATOR_DIGITAL,
      } as ConnectedDevice;

      await expect(
        service.addConnectedDeviceWithConnectStatus(
          'bbb',
          expectedConnectedDevice,
        ),
      ).rejects.toEqual(new NotFoundException('Device not found'));
    });

    it('should add new connected device to device and save it', async () => {
      await createDeviceInDb(deviceModel, mockDeviceOffline);

      await service.addConnectedDeviceWithConnectStatus(
        'ddd',
        newConnectedDevice,
      );

      const dbDevice = (
        await deviceModel.findOne({ id: mockDeviceOffline.id })
      )?.toObject();

      expect(dbDevice?.connectedDevices).toContainEqual(newConnectedDevice);
    });

    it('should return error from upsert', async () => {
      await createDeviceInDb(deviceModel, mockDeviceOffline);

      const doc = { exec: jest.fn() };
      doc.exec.mockRejectedValue(new Error('update error'));
      const findOneAndUpdateSpy = jest.spyOn(deviceModel, 'findOneAndUpdate');
      findOneAndUpdateSpy.mockReturnValue(doc as any);

      await expect(
        service.addConnectedDeviceWithConnectStatus('ddd', newConnectedDevice),
      ).rejects.toEqual(new InternalServerErrorException('update error'));
    });
  });

  describe('updateConnectedDeviceWithNameAndOffset', () => {
    it('should return not found exception when device was not found', async () => {
      await expect(
        service.updateConnectedDeviceWithNameAndOffset(
          'aaa',
          17,
          '000000',
          'new sensor name',
          0.8,
        ),
      ).rejects.toEqual(new NotFoundException('Device not found'));
    });

    it('should return not found exception when connected device was not found', async () => {
      await createDeviceInDb(deviceModel, mockDeviceOffline);

      await expect(
        service.updateConnectedDeviceWithNameAndOffset(
          'ddd',
          17,
          '000000',
          'new sensor name',
          0.8,
        ),
      ).rejects.toEqual(new NotFoundException('Connected device not found'));
    });

    it('should save updated device to database', async () => {
      await createDeviceInDb(deviceModel, mockDeviceOfflineWithConnectedDevice);

      await service.updateConnectedDeviceWithNameAndOffset(
        'ddd',
        18,
        '000000000000',
        'new sensor name',
        0.8,
      );

      const dbDevice = (
        await deviceModel
          .findOne({
            id: mockDeviceOfflineWithConnectedDevice.id,
          })
          .exec()
      )?.toObject();

      expect(dbDevice?.connectedDevices[0].name).toEqual('new sensor name');
      expect(dbDevice?.connectedDevices[0].offset).toEqual(0.8);
    });

    it('should return updated device', async () => {
      await createDeviceInDb(deviceModel, mockDeviceOfflineWithConnectedDevice);

      const device = await service.updateConnectedDeviceWithNameAndOffset(
        'ddd',
        18,
        '000000000000',
        'new sensor name',
        0.8,
      );
      const updatedConnectedDevice = device?.toObject()?.connectedDevices[0];

      expect(updatedConnectedDevice).toMatchObject({
        name: 'new sensor name',
        offset: 0.8,
      });
    });

    it('should send offset to Particle if device is online and sensor connected', async () => {
      await createDeviceInDb(deviceModel, mockDeviceOnlineWithConnectedDevice);

      await service.updateConnectedDeviceWithNameAndOffset(
        'ccc',
        18,
        '000000000000',
        'new sensor name',
        0.8,
      );

      expect(
        mockParticleService.updateConnectedDeviceOffset,
      ).toHaveBeenCalledWith('ccc', 18, '000000000000', 0.8);
    });

    it('should not send offset if device is not online', async () => {
      await createDeviceInDb(deviceModel, mockDeviceOfflineWithConnectedDevice);

      await service.updateConnectedDeviceWithNameAndOffset(
        'ddd',
        18,
        '000000000000',
        'new sensor name',
        0.8,
      );

      expect(
        mockParticleService.updateConnectedDeviceOffset,
      ).not.toHaveBeenCalled();
    });

    it('should return 5xx error if offset to to device fails', async () => {
      await createDeviceInDb(deviceModel, mockDeviceOnlineWithConnectedDevice);
      mockParticleService.updateConnectedDeviceOffset.mockResolvedValue({
        isSuccessful: false,
        errorCode: 403,
        info: 'Device not found',
      });

      await expect(
        service.updateConnectedDeviceWithNameAndOffset(
          'ccc',
          18,
          '000000000000',
          'new sensor name',
          0.8,
        ),
      ).rejects.toEqual(
        new InternalServerErrorException('403: Device not found'),
      );
    });
  });

  describe('updateConnectedDeviceWithConnectStatus', () => {
    it('should return Not Found exceotion if device is not found', async () => {
      await expect(
        service.updateConnectedDeviceWithConnectStatus(
          'bbb',
          {} as ConnectedDevice,
          true,
        ),
      ).rejects.toEqual(new NotFoundException('Device not found'));
    });

    it('should mark connected device as connected device and save it', async () => {
      await createDeviceInDb(deviceModel, mockDeviceOffline);
      const expectedConnectedDevice = {
        ...newConnectedDevice,
        connected: true,
      };

      await service.updateConnectedDeviceWithConnectStatus(
        'ddd',
        newConnectedDevice,
        true,
      );

      const dbDevice = await deviceModel
        .findOne({ id: mockDeviceOffline.id })
        .exec();

      expect(dbDevice?.connectedDevices).toContainEqual(
        expectedConnectedDevice,
      );
    });

    it('should mark connected device as disconnected device and save it', async () => {
      await createDeviceInDb(
        deviceModel,
        mockDeviceOfflineWithConnectedDeviceConnected,
      );

      await service.updateConnectedDeviceWithConnectStatus(
        'ddd',
        mockDeviceOfflineWithConnectedDeviceConnected.connectedDevices[0],
        false,
      );

      const dbDevice = await deviceModel
        .findOne({
          id: mockDeviceOfflineWithConnectedDeviceConnected.id,
        })
        .exec();

      expect(dbDevice?.connectedDevices[0].connected).toBeFalse();
    });

    it('should return error from find device', async () => {
      await closeDatabase();

      const response = { exec: jest.fn().mockRejectedValue('find error') };
      jest.spyOn(deviceModel, 'findOne').mockReturnValue(response as any);

      await expect(
        service.updateConnectedDeviceWithConnectStatus(
          'ddd',
          mockDeviceOfflineWithConnectedDeviceConnected.connectedDevices[0],
          false,
        ),
      ).rejects.toEqual(new InternalServerErrorException('find error'));
    });

    it('should return error from upsert', async () => {
      await createDeviceInDb(deviceModel, mockDeviceOfflineWithConnectedDevice);

      const response = { exec: jest.fn().mockRejectedValue('update error') };
      jest
        .spyOn(deviceModel, 'findOneAndUpdate')
        .mockReturnValue(response as any);

      try {
        await service.updateConnectedDeviceWithConnectStatus(
          'ddd',
          newConnectedDevice,
          true,
        );
        fail();
      } catch (error) {
        expect(error).toEqual(new InternalServerErrorException('update error'));
      }
    });
  });

  describe('restart', () => {
    it('should call Particle service to restart device', async () => {
      await service.restart('bbb');

      expect(mockParticleService.restart).toHaveBeenCalledWith('bbb');
    });

    it('should return true if restart was successful', async () => {
      const result = await service.restart('bbb');

      expect(result).toBe(true);
    });

    it('should return InternalServer error in case update failed', async () => {
      mockParticleService.restart.mockResolvedValue({
        isSuccessful: false,
        errorCode: 403,
        info: 'restart failed',
      });

      await expect(service.restart('bbb')).rejects.toEqual(
        new InternalServerErrorException('403: restart failed'),
      );
    });
  });
});
