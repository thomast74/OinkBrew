import { BullModule, getQueueToken } from '@nestjs/bull';
import {
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  RequestMethod,
} from '@nestjs/common';
import {
  GUARDS_METADATA,
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';

import { IS_PUBLIC_KEY } from '../auth/decorators';
import { ParticleService } from '../common/particle.service';
import { DevicesEventListener } from './devices-event.listener';
import { DevicesController } from './devices.controller';
import { DevicesModule } from './devices.module';
import { DevicesService } from './devices.service';
import { DeviceConnectedDeviceGuard, DeviceNameGuard } from './guards';
import { Device } from './schemas';

describe('DevicesController', () => {
  let module: TestingModule;
  let mockDevicesQueue;

  const mockDevicesService = {
    findAll: jest.fn(),
    update: jest.fn(),
    updateConnectedDeviceWithNameAndOffset: jest.fn(),
    restart: jest.fn(),
  };

  beforeEach(async () => {
    mockDevicesQueue = {
      add: jest.fn(),
    };

    module = await Test.createTestingModule({
      controllers: [DevicesController],
      imports: [
        BullModule.registerQueue({
          name: 'devices',
        }),
      ],
      providers: [DevicesService],
    })
      .overrideProvider(getQueueToken('devices'))
      .useValue(mockDevicesQueue)
      .overrideProvider(DevicesService)
      .useValue(mockDevicesService)
      .compile();
  });

  describe('onApplicationBootstrap', () => {
    it('should add queue devices.refresh', async () => {
      const controller = module.get<DevicesController>(DevicesController);

      controller.onApplicationBootstrap();

      expect(mockDevicesQueue.add).toHaveBeenCalledTimes(1);
      expect(mockDevicesQueue.add).toHaveBeenCalledWith('refresh');
    });
  });

  describe('GET /', () => {
    it('should not be public', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const metadata = Reflect.getMetadata(
        IS_PUBLIC_KEY,
        controller.getListOfDevices,
      );

      expect(metadata).toBeUndefined();
    });

    it('should react to Get /', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const method = Reflect.getMetadata(
        METHOD_METADATA,
        controller.getListOfDevices,
      );
      const path = Reflect.getMetadata(
        PATH_METADATA,
        controller.getListOfDevices,
      );

      expect(method).toEqual(RequestMethod.GET);
      expect(path).toEqual('/');
    });

    it('should return HttpStatus.OK', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const metadata = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        controller.getListOfDevices,
      );

      expect(metadata).toEqual(HttpStatus.OK);
    });

    it('should get all devices from service', async () => {
      const controller = module.get<DevicesController>(DevicesController);
      const response = [{ id: '123' } as Device];
      mockDevicesService.findAll.mockResolvedValue(response);

      const receivedResponse = await controller.getListOfDevices();

      expect(mockDevicesService.findAll).toHaveBeenCalled();
      expect(receivedResponse).toEqual(response);
    });

    it('should return error in case backend has an error', async () => {
      const controller = module.get<DevicesController>(DevicesController);
      mockDevicesService.findAll.mockRejectedValue('db error');

      await expect(controller.getListOfDevices()).rejects.toEqual(
        new HttpException('db error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('POST /{id}/{hwAddress}/{pinNr}', () => {
    it('should not be public', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const metadata = Reflect.getMetadata(
        IS_PUBLIC_KEY,
        controller.updateConnectedDevice,
      );

      expect(metadata).toBeUndefined();
    });

    it('should react to POST /{id}/{hwAddres}/{pinNr}', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const method = Reflect.getMetadata(
        METHOD_METADATA,
        controller.updateConnectedDevice,
      );
      const path = Reflect.getMetadata(
        PATH_METADATA,
        controller.updateConnectedDevice,
      );

      expect(method).toEqual(RequestMethod.PUT);
      expect(path).toEqual('/:id/:hwAddress/:pinNr');
    });

    it('should return HttpStatus.OK', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const metadata = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        controller.updateConnectedDevice,
      );

      expect(metadata).toEqual(HttpStatus.OK);
    });

    it('should use guard DeviceConnectedDevice', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const metadata = Reflect.getMetadata(
        GUARDS_METADATA,
        controller.updateConnectedDevice,
      );

      expect(metadata).toEqual([DeviceConnectedDeviceGuard]);
    });

    it('should call device service with id, hwAddress, pnNr, name and offset', async () => {
      mockDevicesService.updateConnectedDeviceWithNameAndOffset.mockResolvedValue(
        {},
      );
      const controller = module.get<DevicesController>(DevicesController);

      await controller.updateConnectedDevice(
        'abcdefg',
        17,
        '0000000',
        'new sensor name',
        0.8,
      );

      expect(
        mockDevicesService.updateConnectedDeviceWithNameAndOffset,
      ).toHaveBeenCalledWith('abcdefg', 17, '0000000', 'new sensor name', 0.8);
    });

    it('should return not found when device not found in database', async () => {
      mockDevicesService.updateConnectedDeviceWithNameAndOffset.mockRejectedValue(
        new NotFoundException('Device not found'),
      );

      const controller = module.get<DevicesController>(DevicesController);

      await expect(
        controller.updateConnectedDevice(
          'abcdefg',
          18,
          '0000000',
          'new sensor name',
          0.8,
        ),
      ).rejects.toEqual(new NotFoundException('Device not found'));
    });

    it('should return not found when device not found in database', async () => {
      mockDevicesService.updateConnectedDeviceWithNameAndOffset.mockRejectedValue(
        new NotFoundException('Connected Device not found'),
      );

      const controller = module.get<DevicesController>(DevicesController);

      await expect(
        controller.updateConnectedDevice(
          'abcdefg',
          18,
          '0000000',
          'new sensor name',
          0.8,
        ),
      ).rejects.toEqual(new NotFoundException('Connected Device not found'));
    });

    it('should return internal server error for any other error', async () => {
      mockDevicesService.updateConnectedDeviceWithNameAndOffset.mockRejectedValue(
        new InternalServerErrorException('Bad error'),
      );

      const controller = module.get<DevicesController>(DevicesController);

      await expect(
        controller.updateConnectedDevice(
          'abcdefg',
          18,
          '0000000',
          'new sensor name',
          0.8,
        ),
      ).rejects.toEqual(new InternalServerErrorException('Bad error'));
    });
  });

  describe('POST /{id}/refresh', () => {
    it('should not be public', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const metadata = Reflect.getMetadata(
        IS_PUBLIC_KEY,
        controller.restartDevice,
      );

      expect(metadata).toBeUndefined();
    });

    it('should react to POST /{id}/restart', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const method = Reflect.getMetadata(
        METHOD_METADATA,
        controller.restartDevice,
      );
      const path = Reflect.getMetadata(PATH_METADATA, controller.restartDevice);

      expect(method).toEqual(RequestMethod.PUT);
      expect(path).toEqual('/:id/restart');
    });

    it('should return HttpStatus.OK', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const metadata = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        controller.restartDevice,
      );

      expect(metadata).toEqual(HttpStatus.OK);
    });

    it('should call device service with id', async () => {
      mockDevicesService.update.mockResolvedValue({});
      const controller = module.get<DevicesController>(DevicesController);

      await controller.restartDevice('abcdefg');

      expect(mockDevicesService.restart).toHaveBeenCalledWith('abcdefg');
    });
  });

  describe('POST /{id}', () => {
    it('should not be public', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const metadata = Reflect.getMetadata(
        IS_PUBLIC_KEY,
        controller.updateDevice,
      );

      expect(metadata).toBeUndefined();
    });

    it('should react to PUT /{id}', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const method = Reflect.getMetadata(
        METHOD_METADATA,
        controller.updateDevice,
      );
      const path = Reflect.getMetadata(PATH_METADATA, controller.updateDevice);

      expect(method).toEqual(RequestMethod.PUT);
      expect(path).toEqual('/:id');
    });

    it('should return HttpStatus.OK', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const metadata = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        controller.updateDevice,
      );

      expect(metadata).toEqual(HttpStatus.OK);
    });

    it('should use guard DeviceName', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const metadata = Reflect.getMetadata(
        GUARDS_METADATA,
        controller.updateDevice,
      );

      expect(metadata).toEqual([DeviceNameGuard]);
    });

    it('should call device service with id, name and notes', async () => {
      mockDevicesService.update.mockResolvedValue({});
      const controller = module.get<DevicesController>(DevicesController);

      await controller.updateDevice('abcdefg', 'new name', 'my notes');

      expect(mockDevicesService.update).toHaveBeenCalledWith(
        'abcdefg',
        'new name',
        'my notes',
      );
    });

    it('should return not found when device not found in database', async () => {
      mockDevicesService.update.mockRejectedValue(
        new NotFoundException('Device not found'),
      );

      const controller = module.get<DevicesController>(DevicesController);

      await expect(
        controller.updateDevice('abcdefgh', 'new name'),
      ).rejects.toEqual(new NotFoundException('Device not found'));
    });

    it('should return internal server error for any other error', async () => {
      mockDevicesService.update.mockRejectedValue(
        new InternalServerErrorException('Bad error'),
      );

      const controller = module.get<DevicesController>(DevicesController);

      await expect(
        controller.updateDevice('abcdefgh', 'new name'),
      ).rejects.toEqual(new InternalServerErrorException('Bad error'));
    });
  });

  describe('PUT /refresh', () => {
    it('should not be public', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, controller.refresh);

      expect(metadata).toBeUndefined();
    });

    it('should react to PUT refresh', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const method = Reflect.getMetadata(METHOD_METADATA, controller.refresh);
      const path = Reflect.getMetadata(PATH_METADATA, controller.refresh);

      expect(method).toEqual(RequestMethod.PUT);
      expect(path).toEqual('/refresh');
    });

    it('should return HttpStatus.OK', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const metadata = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        controller.refresh,
      );

      expect(metadata).toEqual(HttpStatus.OK);
    });

    it('should return true', async () => {
      const controller = module.get<DevicesController>(DevicesController);

      const receivedResponse = await controller.refresh();

      expect(receivedResponse).toBeTruthy();
    });

    it('should add refresh to devices queue', async () => {
      const controller = module.get<DevicesController>(DevicesController);

      await controller.refresh();

      expect(mockDevicesQueue.add).toHaveBeenCalledTimes(1);
      expect(mockDevicesQueue.add).toHaveBeenCalledWith('refresh');
    });
  });
});
