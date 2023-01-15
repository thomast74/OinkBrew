import { Test, TestingModule } from '@nestjs/testing';
import { when } from 'jest-when';
import { prismaMock } from '../../prisma-singleton';
import { ParticleService } from '../common/particle.service';
import { PrismaService } from '../prisma/prisma.service';
import { DevicesProcessor } from './devices.processor';
import { DevicesService } from './devices.service';

describe('DevicesProcessor', () => {
  let processor: DevicesProcessor;

  const mockParticleService = {
    listDevices: jest.fn(),
    getVariable: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DevicesProcessor, ParticleService, DevicesService],
    })
      .useMocker((token) => {
        if (token === PrismaService) {
          return { client: prismaMock };
        }
      })
      .overrideProvider(ParticleService)
      .useValue(mockParticleService)
      .compile();

    processor = module.get<DevicesProcessor>(DevicesProcessor);
  });

  describe('refresh', () => {
    it('should get devices from particle service', async () => {
      const mockJob = {
        finished: jest.fn(),
        moveToFailed: jest.fn(),
      } as any;

      await processor.refresh(mockJob);

      expect(mockParticleService.listDevices).toHaveBeenCalled();
    });

    it('should save devices to database', async () => {
      const devices = [
        { id: 'a', name: 'aa' },
        { id: 'b', name: 'bb' },
      ];
      const mockJob = {
        moveToFailed: jest.fn(),
      } as any;
      mockParticleService.listDevices.mockResolvedValue(devices);

      await processor.refresh(mockJob);

      expect(prismaMock.device.upsert).toHaveBeenCalledTimes(2);
      expect(prismaMock.device.upsert).toHaveBeenCalledWith({
        where: {
          id: devices[0].id,
        },
        update: { ...devices[0], connectedDevices: [] },
        create: { ...devices[0], connectedDevices: [] },
      });
      expect(prismaMock.device.upsert).toHaveBeenCalledWith({
        where: {
          id: devices[1].id,
        },
        update: { ...devices[1], connectedDevices: [] },
        create: { ...devices[1], connectedDevices: [] },
      });
    });

    it('should get all variables when device is connected', async () => {
      const devices = [
        { id: 'a', name: 'aa', connected: true },
        { id: 'b', name: 'bb' },
      ];
      const mockJob = {
        moveToFailed: jest.fn(),
      } as any;
      mockParticleService.listDevices.mockResolvedValue(devices);

      await processor.refresh(mockJob);

      expect(mockParticleService.getVariable).toHaveBeenCalledTimes(3);
      expect(mockParticleService.getVariable).toHaveBeenCalledWith(
        devices[0].id,
        'ShieldVersion',
      );
      expect(mockParticleService.getVariable).toHaveBeenCalledWith(
        devices[0].id,
        'Version',
      );
      expect(mockParticleService.getVariable).toHaveBeenCalledWith(
        devices[0].id,
        'Devices',
      );
    });

    it('should save variables to device with no previous connected devices', async () => {
      const devices = [
        { id: 'a', name: 'aa', connected: true },
        { id: 'b', name: 'bb' },
      ];
      const mockJob = {
        moveToFailed: jest.fn(),
      } as any;
      mockParticleService.listDevices.mockResolvedValue(devices);
      when(mockParticleService.getVariable)
        .calledWith(devices[0].id, 'ShieldVersion')
        .mockResolvedValue('2')
        .calledWith(devices[0].id, 'Version')
        .mockResolvedValue('1.0')
        .calledWith(devices[0].id, 'Devices')
        .mockResolvedValue(connectedDevicesNew);

      await processor.refresh(mockJob);

      const expectedDevice = {
        ...devices[0],
        shieldVersion: 2,
        firmwareVersion: 1.0,
        connectedDevices: expectedConnectedDevicesNew,
      };

      expect(prismaMock.device.upsert).toHaveBeenCalledWith({
        where: {
          id: devices[0].id,
        },
        update: expectedDevice,
        create: expectedDevice,
      });
    });

    it('should save variables to device with previous connected devices', async () => {
      const devices = [
        {
          id: 'a',
          name: 'aa',
          connected: true,
          shieldVersion: 2,
          firmwareVersion: 1.0,
          connectedDevices: savedConnectedDevicesExisting,
        },
        { id: 'b', name: 'bb' },
      ];
      const mockJob = {
        moveToFailed: jest.fn(),
      } as any;
      mockParticleService.listDevices.mockResolvedValue(devices);
      when(mockParticleService.getVariable)
        .calledWith(devices[0].id, 'ShieldVersion')
        .mockResolvedValue('2')
        .calledWith(devices[0].id, 'Version')
        .mockResolvedValue('1.0')
        .calledWith(devices[0].id, 'Devices')
        .mockResolvedValue(connectedDevicesExisting);

      await processor.refresh(mockJob);

      const expectedDevice = {
        ...devices[0],
        connectedDevices: expectedConnectedDevicesExisting,
      };

      expect(prismaMock.device.upsert).toHaveBeenCalledWith({
        where: {
          id: devices[0].id,
        },
        update: expectedDevice,
        create: expectedDevice,
      });
    });

    it('should call job.moveToFailed when particle has an error', async () => {
      const mockJob = {
        finished: jest.fn(),
        moveToFailed: jest.fn(),
      } as any;
      mockParticleService.listDevices.mockRejectedValue('funny error');

      await processor.refresh(mockJob);

      expect(mockJob.moveToFailed).toHaveBeenCalled();
    });
  });
});

const connectedDevicesNew =
  '[{"type":1,"pin_nr":"10","hw_address":"0000000000000000"},{"type":1,"pin_nr":"11","hw_address":"0000000000000000"},{"type":1,"pin_nr":"16","hw_address":"0000000000000000"},{"type":1,"pin_nr":"17","hw_address":"0000000000000000"}]';
const expectedConnectedDevicesNew = [
  {
    type: 1,
    pin_nr: '10',
    hw_address: '0000000000000000',
    connected: true,
    name: undefined,
  },
  {
    type: 1,
    pin_nr: '11',
    hw_address: '0000000000000000',
    connected: true,
    name: undefined,
  },
  {
    type: 1,
    pin_nr: '16',
    hw_address: '0000000000000000',
    connected: true,
    name: undefined,
  },
  {
    type: 1,
    pin_nr: '17',
    hw_address: '0000000000000000',
    connected: true,
    name: undefined,
  },
];

const savedConnectedDevicesExisting = [
  { type: 1, pin_nr: '10', connected: true, hw_address: '0000000000000000' },
  { type: 1, pin_nr: '11', connected: true, hw_address: '0000000000000000' },
  { type: 1, pin_nr: '16', connected: true, hw_address: '0000000000000000' },
  { type: 1, pin_nr: '17', connected: true, hw_address: '0000000000000000' },
  {
    name: 'HWT In',
    type: 3,
    pin_nr: '0',
    connected: true,
    hw_address: '2886927306000083',
  },
];
const connectedDevicesExisting =
  '[{"type":1,"pin_nr":"10","hw_address":"0000000000000000"},{"type":1,"pin_nr":"11","hw_address":"0000000000000000"},{"type":1,"pin_nr":"16","hw_address":"0000000000000000"},{"type":1,"pin_nr":"17","hw_address":"0000000000000000"}]';
const expectedConnectedDevicesExisting = [
  {
    type: 1,
    pin_nr: '10',
    hw_address: '0000000000000000',
    connected: true,
    name: undefined,
  },
  {
    type: 1,
    pin_nr: '11',
    hw_address: '0000000000000000',
    connected: true,
    name: undefined,
  },
  {
    type: 1,
    pin_nr: '16',
    hw_address: '0000000000000000',
    connected: true,
    name: undefined,
  },
  {
    type: 1,
    pin_nr: '17',
    hw_address: '0000000000000000',
    connected: true,
    name: undefined,
  },
  {
    name: 'HWT In',
    type: 3,
    pin_nr: '0',
    connected: false,
    hw_address: '2886927306000083',
  },
];
