import { getQueueToken } from '@nestjs/bull';
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
import { Device } from '@prisma/client';
import { IS_PUBLIC_KEY } from '../auth/decorators';
import { DevicesController } from './devices.controller';
import { DevicesModule } from './devices.module';
import { DevicesService } from './devices.service';
import { DeviceNameGuard } from './guards';

describe('DevicesController', () => {
  let module: TestingModule;
  let mockDevicesQueue;

  const mockDevicesService = {
    findAll: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    mockDevicesQueue = {
      add: jest.fn(),
    };

    module = await Test.createTestingModule({
      imports: [DevicesModule],
    })
      .overrideProvider(getQueueToken('devices'))
      .useValue(mockDevicesQueue)
      .overrideProvider(DevicesService)
      .useValue(mockDevicesService)
      .compile();
  });

  afterAll(async () => await module.close());

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

  describe('POST /{id}', () => {
    it('should not be public', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const metadata = Reflect.getMetadata(
        IS_PUBLIC_KEY,
        controller.updateDevice,
      );

      expect(metadata).toBeUndefined();
    });

    it('should react to POST /{id}', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const method = Reflect.getMetadata(
        METHOD_METADATA,
        controller.updateDevice,
      );
      const path = Reflect.getMetadata(PATH_METADATA, controller.updateDevice);

      expect(method).toEqual(RequestMethod.POST);
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

    it('should return bad request when device not found in database', async () => {
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
