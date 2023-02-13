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

    mockParticleService.updateDevice.mockResolvedValue(void 0);
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
      mockParticleService.updateDevice.mockRejectedValue(
        new Error('Particle device update failed'),
      );

      await expect(
        service.update('aaa', 'new name', 'my notes'),
      ).rejects.toEqual(
        new InternalServerErrorException('Particle device update failed'),
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

  describe('addConnectedDevice', () => {
    it('should find the device', async () => {
      const expectedConnectedDevice = {
        type: ConnectedDeviceType.DEVICE_HARDWARE_ACTUATOR_DIGITAL,
      } as ConnectedDevice;

      await service.addConnectedDevice('bbb', expectedConnectedDevice);

      expect(prismaMock.device.findUnique).toHaveBeenCalledWith({
        where: { id: 'bbb' },
      });
    });

    it('should not save document in case device not found', async () => {
      prismaMock.device.findUnique.mockResolvedValue(null);

      await service.addConnectedDevice('bbb', newConnectedDevice);

      expect(prismaMock.device.upsert).not.toHaveBeenCalled();
    });

    it('should add new connected device to device and save it', async () => {
      prismaMock.device.findUnique.mockResolvedValue(
        deviceWithNoConnectedDevice,
      );

      await service.addConnectedDevice('bbb', newConnectedDevice);

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
        await service.addConnectedDevice('bbb', newConnectedDevice);
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
        await service.addConnectedDevice('bbb', newConnectedDevice);
        fail();
      } catch (error) {
        expect(error).toEqual('upsert error');
      }
    });
  });

  describe('updateConnectedDevice', () => {
    it('should find the device', async () => {
      const expectedConnectedDevice = {
        type: ConnectedDeviceType.DEVICE_HARDWARE_ACTUATOR_DIGITAL,
      } as ConnectedDevice;

      await service.updateConnectedDevice('bbb', expectedConnectedDevice, true);

      expect(prismaMock.device.findUnique).toHaveBeenCalledWith({
        where: { id: 'bbb' },
      });
    });

    it('should not save document in case device not found', async () => {
      prismaMock.device.findUnique.mockResolvedValue(null);

      await service.updateConnectedDevice('bbb', newConnectedDevice, true);

      expect(prismaMock.device.upsert).not.toHaveBeenCalled();
    });

    it('should mark connected device as connected device and save it', async () => {
      prismaMock.device.findUnique.mockResolvedValue(
        deviceWithConnectedDevicesDisconnect,
      );

      await service.updateConnectedDevice('bbb', newConnectedDevice, true);

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

      await service.updateConnectedDevice('bbb', newConnectedDevice, false);

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
        await service.updateConnectedDevice('bbb', newConnectedDevice, true);
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
        await service.updateConnectedDevice('bbb', newConnectedDevice, true);
        fail();
      } catch (error) {
        expect(error).toEqual('upsert error');
      }
    });
  });
});

const newConnectedDevice = ConnectedDevice.parseData({
  type: ConnectedDeviceType.DEVICE_HARDWARE_ACTUATOR_DIGITAL,
  pin_nr: '11',
  hw_address: '000000000000',
  name: undefined,
  connected: false,
});

const secondConnectedDevice = ConnectedDevice.parseData({
  type: ConnectedDeviceType.DEVICE_HARDWARE_ACTUATOR_DIGITAL,
  pin_nr: '12',
  hw_address: '000000000000',
  name: undefined,
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
