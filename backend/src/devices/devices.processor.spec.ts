import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { when } from 'jest-when';

import { ParticleService } from '../common/particle.service';
import { DevicesProcessor } from './devices.processor';
import { DevicesService } from './devices.service';
import { Device } from './schemas';

describe('DevicesProcessor', () => {
  let processor: DevicesProcessor;

  const mockDevicesService = {
    findById: jest.fn(),
    save: jest.fn(),
  };

  const mockParticleService = {
    listDevices: jest.fn(),
    getVariable: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DevicesProcessor, ParticleService, DevicesService],
    })
      .overrideProvider(DevicesService)
      .useValue(mockDevicesService)
      .overrideProvider(ParticleService)
      .useValue(mockParticleService)
      .compile();

    processor = module.get<DevicesProcessor>(DevicesProcessor);

    mockParticleService.listDevices.mockReset();
    mockParticleService.getVariable.mockReset();
    mockDevicesService.findById.mockReset();
    mockDevicesService.save.mockReset();
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

    it('should find whether device already exists', async () => {
      const devices = [{ id: 'a', name: 'aa' }];
      mockParticleService.listDevices.mockResolvedValue(devices);

      await processor.refresh(mockJob);

      expect(mockDevicesService.findById).toHaveBeenCalledOnce();
      expect(mockDevicesService.findById).toHaveBeenCalledWith('a');
    });

    it('should save devices to database', async () => {
      const devices = [
        { id: 'a', name: 'aa' },
        { id: 'b', name: 'bb' },
      ];
      mockParticleService.listDevices.mockResolvedValue(devices);

      await processor.refresh(mockJob);

      expect(mockDevicesService.save).toHaveBeenCalledTimes(2);
      expect(mockDevicesService.save).toHaveBeenCalledWith({
        ...devices[0],
        connectedDevices: [],
      });
      expect(mockDevicesService.save).toHaveBeenCalledWith({
        ...devices[1],
        connectedDevices: [],
      });
    });

    it('should save devices to database if device was not found', async () => {
      const devices = [
        { id: 'a', name: 'aa' },
        { id: 'b', name: 'bb' },
      ];
      mockParticleService.listDevices.mockResolvedValue(devices);
      mockDevicesService.findById.mockImplementation(() => {
        throw new NotFoundException();
      });

      await processor.refresh(mockJob);

      expect(mockDevicesService.save).toHaveBeenCalledTimes(2);
      expect(mockDevicesService.save).toHaveBeenCalledWith({
        ...devices[0],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        connectedDevices: [],
      });
      expect(mockDevicesService.save).toHaveBeenCalledWith({
        ...devices[1],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        connectedDevices: [],
      });
    });

    it('should get all variables when device is connected', async () => {
      const devices = [
        { id: 'a', name: 'aa', connected: true },
        { id: 'b', name: 'bb' },
      ];
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
      mockParticleService.listDevices.mockResolvedValue(devices);
      when(mockParticleService.getVariable)
        .calledWith(devices[0].id, 'ShieldVersion')
        .mockResolvedValue('2')
        .calledWith(devices[0].id, 'Version')
        .mockResolvedValue('1.0')
        .calledWith(devices[0].id, 'Devices')
        .mockResolvedValue(connectedDevicesNew);
      const expectedDevice = {
        ...devices[0],
        shieldVersion: 2,
        firmwareVersion: 1,
        connectedDevices: expectedConnectedDevicesNew,
      };

      await processor.refresh(mockJob);

      expect(mockDevicesService.save).toHaveBeenCalledWith(expectedDevice);
    });

    it('should save variables to device with previous connected devices', async () => {
      const devices = [
        { id: 'a', name: 'aa', connected: true },
        { id: 'b', name: 'bb' },
      ];
      mockDevicesService.findById
        .mockResolvedValueOnce(savedDevice as Device)
        .mockResolvedValueOnce(devices[1] as Device);
      mockParticleService.listDevices.mockResolvedValue(devices);
      when(mockParticleService.getVariable)
        .calledWith(devices[0].id, 'ShieldVersion')
        .mockResolvedValue('2')
        .calledWith(devices[0].id, 'Version')
        .mockResolvedValue('1.0')
        .calledWith(devices[0].id, 'Devices')
        .mockResolvedValue(connectedDevicesExisting);
      const expectedDevice = {
        ...devices[0],
        firmwareVersion: 1,
        shieldVersion: 2,
        connectedDevices: expectedConnectedDevicesExisting,
      };

      await processor.refresh(mockJob);

      expect(mockDevicesService.save).toHaveBeenCalledWith(expectedDevice);
    });

    it('should call job.moveToFailed when particle has an error', async () => {
      mockParticleService.listDevices.mockRejectedValue('funny error');

      await processor.refresh(mockJob);

      expect(mockJob.moveToFailed).toHaveBeenCalled();
    });
  });
});

const mockJob = {
  finished: jest.fn(),
  moveToFailed: jest.fn(),
} as any;

const connectedDevicesNew =
  '[{"type":1,"pinNr":10,"hwAddress":"0000000000000000","deviceOffset":0.5},{"type":1,"pinNr":11,"hwAddress":"0000000000000000"},{"type":1,"pinNr":16,"hwAddress":"0000000000000000"},{"type":1,"pinNr":17,"hwAddress":"0000000000000000"}]';
const expectedConnectedDevicesNew = [
  {
    type: 1,
    pinNr: 10,
    hwAddress: '0000000000000000',
    connected: true,
    name: null,
    offset: 0.0,
    deviceOffset: 0.5,
  },
  {
    type: 1,
    pinNr: 11,
    hwAddress: '0000000000000000',
    connected: true,
    name: null,
    offset: 0.0,
    deviceOffset: 0.0,
  },
  {
    type: 1,
    pinNr: 16,
    hwAddress: '0000000000000000',
    connected: true,
    name: null,
    offset: 0.0,
    deviceOffset: 0.0,
  },
  {
    type: 1,
    pinNr: 17,
    hwAddress: '0000000000000000',
    connected: true,
    name: null,
    offset: 0.0,
    deviceOffset: 0.0,
  },
];

const savedConnectedDevicesExisting = [
  {
    type: 1,
    pinNr: 10,
    hwAddress: '0000000000000000',
    connected: true,
    name: null,
    offset: 0.5,
    deviceOffset: 0.0,
  },
  {
    type: 1,
    pinNr: 11,
    connected: true,
    hwAddress: '0000000000000000',
    name: null,
    offset: 0.0,
    deviceOffset: 0.0,
  },
  {
    type: 1,
    pinNr: 16,
    connected: true,
    hwAddress: '0000000000000000',
    name: null,
    offset: 0.0,
    deviceOffset: 0.0,
  },
  {
    type: 1,
    pinNr: 17,
    hwAddress: '0000000000000000',
    connected: true,
    name: null,
    offset: 0.0,
    deviceOffset: 0.0,
  },
  {
    type: 3,
    pinNr: 0,
    hwAddress: '2886927306000083',
    connected: true,
    name: 'HWT In',
    offset: 0.0,
    deviceOffset: 0.0,
  },
];
const savedDevice = {
  id: 'a',
  name: 'aa',
  connectedDevices: savedConnectedDevicesExisting,
} as Device;

const connectedDevicesExisting =
  '[{"type":1,"pinNr":10,"hwAddress":"0000000000000000","deviceOffset":0.5},{"type":1,"pinNr":11,"hwAddress":"0000000000000000"},{"type":1,"pinNr":16,"hwAddress":"0000000000000000"},{"type":1,"pinNr":17,"hwAddress":"0000000000000000"}]';
const expectedConnectedDevicesExisting = [
  {
    type: 1,
    pinNr: 10,
    hwAddress: '0000000000000000',
    connected: true,
    name: null,
    offset: 0.5,
    deviceOffset: 0.5,
  },
  {
    type: 1,
    pinNr: 11,
    hwAddress: '0000000000000000',
    connected: true,
    name: null,
    offset: 0.0,
    deviceOffset: 0.0,
  },
  {
    type: 1,
    pinNr: 16,
    hwAddress: '0000000000000000',
    connected: true,
    name: null,
    offset: 0.0,
    deviceOffset: 0.0,
  },
  {
    type: 1,
    pinNr: 17,
    hwAddress: '0000000000000000',
    connected: true,
    name: null,
    offset: 0.0,
    deviceOffset: 0.0,
  },
  {
    type: 3,
    pinNr: 0,
    hwAddress: '2886927306000083',
    connected: false,
    name: 'HWT In',
    offset: 0.0,
    deviceOffset: 0.0,
  },
];
