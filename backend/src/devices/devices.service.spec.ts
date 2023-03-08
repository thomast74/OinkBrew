import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Device, Prisma } from '@prisma/client';
import { prismaMock } from '../../prisma-singleton';
import { ParticleService } from '../common/particle.service';
import { PrismaService } from '../prisma/prisma.service';
import { DevicesService } from './devices.service';
import { ConnectedDevice, ConnectedDeviceType } from './types';

describe('DevicesService', () => {
  let service: DevicesService;

  const mockParticleService = {
    updateDevice: jest.fn(),
    updateConnectedDeviceOffset: jest.fn(),
    restart: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [DevicesService, ParticleService],
    })
      .useMocker((token) => {
        if (token === PrismaService) {
          return { client: prismaMock };
        }
      })
      .overrideProvider(ParticleService)
      .useValue(mockParticleService)
      .compile();

    service = module.get<DevicesService>(DevicesService);

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

  describe('findAll', () => {
    it('should call prisma to get all devices with sensors', async () => {
      await service.findAll();

      expect(prismaMock.device.findMany).toHaveBeenCalled();
    });

    it('should return found devices', async () => {
      const expectedDevices = [{ id: 'aaa', name: 'bb bcccddd' } as Device];
      prismaMock.device.findMany.mockResolvedValue(expectedDevices);

      const receivedDevices = await service.findAll();

      expect(receivedDevices).toEqual(expectedDevices);
    });

    it('should return error from prisma client', async () => {
      prismaMock.device.findMany.mockRejectedValue(new Error('db error'));

      await expect(service.findAll()).rejects.toEqual(new Error('db error'));
    });
  });

  describe('findById', () => {
    it('should call prisma get single record by deviceId', async () => {
      await service.findById('aaa');

      expect(prismaMock.device.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'aaa',
        },
      });
    });

    it('should return found device', async () => {
      const expectedDevice = { id: 'aaa', name: 'bb bcccddd' } as Device;
      prismaMock.device.findUnique.mockResolvedValue(expectedDevice);

      const device = await service.findById('aaa');

      expect(device).toEqual(expectedDevice);
    });

    it('should return null if device was not found', async () => {
      const expectedDevice = null;
      prismaMock.device.findUnique.mockResolvedValue(expectedDevice);

      const device = await service.findById('aaa');

      expect(device).toEqual(expectedDevice);
    });

    it('should return error in case of prisma error', async () => {
      prismaMock.device.findUnique.mockRejectedValue('bad');

      try {
        await service.findById('aaa');
        fail();
      } catch (error) {
        expect(error).toEqual('bad');
      }
    });
  });

  describe('update', () => {
    it('should return NotFoundException when no device found', async () => {
      prismaMock.device.findUnique.mockResolvedValue(null);

      await expect(service.update('aaa', 'bbb', 'ccc')).rejects.toEqual(
        new NotFoundException('Device not found'),
      );
    });

    it('should save updated device to database', async () => {
      const dbDevice = { id: 'aaa', name: 'old name', notes: null } as Device;
      const newDevice = {
        id: 'aaa',
        name: 'new name',
        notes: 'my notes',
      } as Device;
      prismaMock.device.findUnique.mockResolvedValue(dbDevice);

      await service.update('aaa', 'new name', 'my notes');

      expect(prismaMock.device.upsert).toHaveBeenCalledWith({
        where: {
          id: 'aaa',
        },
        update: newDevice,
        create: newDevice,
      });
    });

    it('should return internal server error when save has an error', async () => {
      const dbDevice = { id: 'aaa', name: 'old name', notes: null } as Device;
      prismaMock.device.findUnique.mockResolvedValue(dbDevice);
      prismaMock.device.upsert.mockRejectedValue(new Error('Save error'));

      await expect(
        service.update('aaa', 'new name', 'my notes'),
      ).rejects.toEqual(new InternalServerErrorException('Save error'));
    });

    it('should call ParticleService to update name and notes', async () => {
      const dbDevice = { id: 'aaa', name: 'old name', notes: null } as Device;
      prismaMock.device.findUnique.mockResolvedValue(dbDevice);
      prismaMock.device.upsert.mockResolvedValue(dbDevice);

      await service.update('aaa', 'new name', 'my notes');

      expect(mockParticleService.updateDevice).toHaveBeenCalledWith(
        'aaa',
        'new name',
        'my notes',
      );
    });

    it('should return internal server error when particle update fails', async () => {
      const dbDevice = { id: 'aaa', name: 'old name', notes: null } as Device;
      prismaMock.device.findUnique.mockResolvedValue(dbDevice);
      prismaMock.device.upsert.mockResolvedValue(dbDevice);
      mockParticleService.updateDevice.mockResolvedValue({
        isSuccessful: false,
        errorCode: 403,
        info: 'Particle device update failed',
      });

      await expect(
        service.update('aaa', 'new name', 'my notes'),
      ).rejects.toEqual(
        new InternalServerErrorException('403: Particle device update failed'),
      );
    });
  });

  describe('save', () => {
    it('should call prisma tp upsert a device', async () => {
      const expectedDevice = { id: 'aaa', name: 'bb bcccddd' } as Device;

      await service.save(expectedDevice);

      expect(prismaMock.device.upsert).toHaveBeenCalledWith({
        where: {
          id: 'aaa',
        },
        update: expectedDevice,
        create: expectedDevice,
      });
    });

    it('should return error in case of prisma error', async () => {
      const expectedDevice = { id: 'aaa', name: 'bb bcccddd' } as Device;
      prismaMock.device.upsert.mockRejectedValue('bad');

      try {
        await service.save(expectedDevice);
        fail();
      } catch (error) {
        expect(error).toEqual('bad');
      }
    });
  });

  describe('addConnectedDeviceWithConnectStatus', () => {
    it('should find the device', async () => {
      const expectedConnectedDevice = {
        type: ConnectedDeviceType.DEVICE_HARDWARE_ACTUATOR_DIGITAL,
      } as ConnectedDevice;

      await service.addConnectedDeviceWithConnectStatus(
        'bbb',
        expectedConnectedDevice,
      );

      expect(prismaMock.device.findUnique).toHaveBeenCalledWith({
        where: { id: 'bbb' },
      });
    });

    it('should not save document in case device not found', async () => {
      prismaMock.device.findUnique.mockResolvedValue(null);

      await service.addConnectedDeviceWithConnectStatus(
        'bbb',
        newConnectedDevice,
      );

      expect(prismaMock.device.upsert).not.toHaveBeenCalled();
    });

    it('should add new connected device to device and save it', async () => {
      prismaMock.device.findUnique.mockResolvedValue(
        deviceWithNoConnectedDevice,
      );

      await service.addConnectedDeviceWithConnectStatus(
        'bbb',
        newConnectedDevice,
      );

      expect(prismaMock.device.upsert).toHaveBeenCalledWith({
        where: {
          id: expectedDeviceWithNewConnectedDevice.id,
        },
        update: expectedDeviceWithNewConnectedDevice,
        create: expectedDeviceWithNewConnectedDevice,
      });
    });

    it('should return error from find device', async () => {
      prismaMock.device.findUnique.mockRejectedValue('findUnique error');

      try {
        await service.addConnectedDeviceWithConnectStatus(
          'bbb',
          newConnectedDevice,
        );
        fail();
      } catch (error) {
        expect(error).toEqual('findUnique error');
      }
    });

    it('should return error from upsert', async () => {
      prismaMock.device.findUnique.mockResolvedValue(
        deviceWithNoConnectedDevice,
      );
      prismaMock.device.upsert.mockRejectedValue('upsert error');

      try {
        await service.addConnectedDeviceWithConnectStatus(
          'bbb',
          newConnectedDevice,
        );
        fail();
      } catch (error) {
        expect(error).toEqual('upsert error');
      }
    });
  });

  describe('updateConnectedDeviceWithNameAndOffset', () => {
    it('should return not found exception when device was not found', async () => {
      prismaMock.device.findUnique.mockResolvedValue(null);

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
      prismaMock.device.findUnique.mockResolvedValue(
        deviceWithNoConnectedDevice,
      );

      await expect(
        service.updateConnectedDeviceWithNameAndOffset(
          'bbb',
          17,
          '000000',
          'new sensor name',
          0.8,
        ),
      ).rejects.toEqual(new NotFoundException('Connected device not found'));
    });

    it('should save updated device to database', async () => {
      prismaMock.device.findUnique.mockResolvedValue(
        deviceWithConnectedDeviceDb,
      );

      await service.updateConnectedDeviceWithNameAndOffset(
        'bbb',
        18,
        '000000000000',
        'new sensor name',
        0.8,
      );

      expect(prismaMock.device.upsert).toHaveBeenCalledWith({
        where: {
          id: 'bbb',
        },
        update: expectedDeviceWithConnectedDeviceDb,
        create: expectedDeviceWithConnectedDeviceDb,
      });
    });

    it('should return updated device', async () => {
      prismaMock.device.findUnique.mockResolvedValue(
        deviceWithConnectedDeviceDb,
      );

      const device = await service.updateConnectedDeviceWithNameAndOffset(
        'bbb',
        18,
        '000000000000',
        'new sensor name',
        0.8,
      );

      expect(device).toEqual(expectedDeviceWithConnectedDeviceDb);
    });

    it('should send offset to Particle if device is online and sensor connected', async () => {
      prismaMock.device.findUnique.mockResolvedValue(
        expectedDeviceWithConnectedDeviceDbOnline,
      );

      await service.updateConnectedDeviceWithNameAndOffset(
        'bbb',
        18,
        '000000000000',
        'new sensor name',
        0.8,
      );

      expect(
        mockParticleService.updateConnectedDeviceOffset,
      ).toHaveBeenCalledWith('bbb', 18, '000000000000', 0.8);
    });

    it('should not send offset if device is not online', async () => {
      prismaMock.device.findUnique.mockResolvedValue(
        deviceWithConnectedDeviceDb,
      );

      await service.updateConnectedDeviceWithNameAndOffset(
        'bbb',
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
      prismaMock.device.findUnique.mockResolvedValue(
        expectedDeviceWithConnectedDeviceDbOnline,
      );
      mockParticleService.updateConnectedDeviceOffset.mockResolvedValue({
        isSuccessful: false,
        errorCode: 403,
        info: 'Device not found',
      });

      await expect(
        service.updateConnectedDeviceWithNameAndOffset(
          'bbb',
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
    it('should find the device', async () => {
      const expectedConnectedDevice = {
        type: ConnectedDeviceType.DEVICE_HARDWARE_ACTUATOR_DIGITAL,
      } as ConnectedDevice;

      await service.updateConnectedDeviceWithConnectStatus(
        'bbb',
        expectedConnectedDevice,
        true,
      );

      expect(prismaMock.device.findUnique).toHaveBeenCalledWith({
        where: { id: 'bbb' },
      });
    });

    it('should not save document in case device not found', async () => {
      prismaMock.device.findUnique.mockResolvedValue(null);

      await service.updateConnectedDeviceWithConnectStatus(
        'bbb',
        newConnectedDevice,
        true,
      );

      expect(prismaMock.device.upsert).not.toHaveBeenCalled();
    });

    it('should mark connected device as connected device and save it', async () => {
      prismaMock.device.findUnique.mockResolvedValue(
        deviceWithConnectedDevicesDisconnect,
      );

      await service.updateConnectedDeviceWithConnectStatus(
        'bbb',
        newConnectedDevice,
        true,
      );

      expect(prismaMock.device.upsert).toHaveBeenCalledWith({
        where: {
          id: expectedDeviceWithConnectedDeviceConnected.id,
        },
        update: expectedDeviceWithConnectedDeviceConnected,
        create: expectedDeviceWithConnectedDeviceConnected,
      });
    });

    it('should mark connected device as disconnected device and save it', async () => {
      prismaMock.device.findUnique.mockResolvedValue(
        deviceWithConnectedDevicesConnected,
      );

      await service.updateConnectedDeviceWithConnectStatus(
        'bbb',
        newConnectedDevice,
        false,
      );

      expect(prismaMock.device.upsert).toHaveBeenCalledWith({
        where: {
          id: expectedDeviceWithConnectedDeviceDisconnected.id,
        },
        update: expectedDeviceWithConnectedDeviceDisconnected,
        create: expectedDeviceWithConnectedDeviceDisconnected,
      });
    });

    it('should return error from find device', async () => {
      prismaMock.device.findUnique.mockRejectedValue('findUnique error');

      try {
        await service.updateConnectedDeviceWithConnectStatus(
          'bbb',
          newConnectedDevice,
          true,
        );
        fail();
      } catch (error) {
        expect(error).toEqual('findUnique error');
      }
    });

    it('should return error from upsert', async () => {
      prismaMock.device.findUnique.mockResolvedValue(
        deviceWithNoConnectedDevice,
      );
      prismaMock.device.upsert.mockRejectedValue('upsert error');

      try {
        await service.updateConnectedDeviceWithConnectStatus(
          'bbb',
          newConnectedDevice,
          true,
        );
        fail();
      } catch (error) {
        expect(error).toEqual('upsert error');
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

  describe('findConnectedDeviceFromDevice', () => {
    it('should return connected device of device', () => {
      const cDevice = service.findConnectedDeviceFromDevice(
        deviceWithConnectedDevicesConnected,
        12,
        '000000000000',
      );

      expect(cDevice).toBeDefined();
    });

    it('should return null if connected device was not found', () => {
      const cDevice = service.findConnectedDeviceFromDevice(
        deviceWithConnectedDevicesConnected,
        2,
        '00000000',
      );

      expect(cDevice).toBeUndefined();
    });
  });
});

const newConnectedDevice = ConnectedDevice.parseData({
  type: ConnectedDeviceType.DEVICE_HARDWARE_ACTUATOR_DIGITAL,
  pinNr: 11,
  hwAddress: '000000000000',
  name: undefined,
  offset: 0.0,
  deviceOffset: 0.0,
  connected: false,
});

const secondConnectedDevice = ConnectedDevice.parseData({
  type: ConnectedDeviceType.DEVICE_HARDWARE_ACTUATOR_DIGITAL,
  pinNr: 12,
  hwAddress: '000000000000',
  name: undefined,
  offset: 0.0,
  deviceOffset: 0.0,
  connected: false,
});

const deviceWithNoConnectedDevice = {
  id: 'bbb',
  connectedDevices: [] as Prisma.JsonArray,
} as Device;

const deviceWithConnectedDevicesDisconnect = {
  id: 'bbb',
  connectedDevices: [
    { ...secondConnectedDevice },
    { ...newConnectedDevice },
  ] as Prisma.JsonArray,
} as Device;

const deviceWithConnectedDevicesConnected = {
  id: 'bbb',
  connectedDevices: [
    { ...secondConnectedDevice },
    { ...newConnectedDevice, connected: true },
  ] as Prisma.JsonArray,
} as Device;

const expectedDeviceWithNewConnectedDevice = {
  id: 'bbb',
  connectedDevices: [
    {
      ...newConnectedDevice,
      connected: true,
    },
  ] as Prisma.JsonArray,
} as Device;

const expectedDeviceWithConnectedDeviceConnected = {
  id: 'bbb',
  connectedDevices: [
    { ...secondConnectedDevice },
    {
      ...newConnectedDevice,
      connected: true,
    },
  ] as Prisma.JsonArray,
} as Device;

const expectedDeviceWithConnectedDeviceDisconnected = {
  id: 'bbb',
  connectedDevices: [
    { ...secondConnectedDevice },
    {
      ...newConnectedDevice,
      connected: false,
    },
  ] as Prisma.JsonArray,
} as Device;

const dbConnectedDevice = {
  type: ConnectedDeviceType.DEVICE_HARDWARE_ACTUATOR_DIGITAL,
  pinNr: 18,
  hwAddress: '000000000000',
  name: undefined,
  offset: 0.0,
  deviceOffset: 0.0,
  connected: false,
};

const dbConnectedDeviceUpdated = {
  type: ConnectedDeviceType.DEVICE_HARDWARE_ACTUATOR_DIGITAL,
  pinNr: 18,
  hwAddress: '000000000000',
  name: 'new sensor name',
  offset: 0.8,
  deviceOffset: 0.0,
  connected: false,
};

const deviceWithConnectedDeviceDb = {
  id: 'bbb',
  online: false,
  connectedDevices: [dbConnectedDevice] as Prisma.JsonArray,
} as Device;

const expectedDeviceWithConnectedDeviceDb = {
  id: 'bbb',
  online: false,
  connectedDevices: [dbConnectedDeviceUpdated] as Prisma.JsonArray,
} as Device;

const expectedDeviceWithConnectedDeviceDbOnline = {
  id: 'bbb',
  online: true,
  connectedDevices: [dbConnectedDeviceUpdated] as Prisma.JsonArray,
} as Device;
