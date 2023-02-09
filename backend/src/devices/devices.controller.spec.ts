import { getQueueToken } from '@nestjs/bull';
import { HttpException, HttpStatus, RequestMethod } from '@nestjs/common';
import {
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

describe('DevicesController', () => {
  let module: TestingModule;
  let mockDevicesQueue;

  const mockDevicesService = {
    findAll: jest.fn(),
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

    it('should return error in case backend has an error', () => {
      const controller = module.get<DevicesController>(DevicesController);
      mockDevicesService.findAll.mockRejectedValue('db error');

      expect(controller.getListOfDevices()).rejects.toEqual(
        new HttpException('db error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('POST /refresh', () => {
    it('should not be public', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, controller.refresh);

      expect(metadata).toBeUndefined();
    });

    it('should react to POST refresh', () => {
      const controller = module.get<DevicesController>(DevicesController);
      const method = Reflect.getMetadata(METHOD_METADATA, controller.refresh);
      const path = Reflect.getMetadata(PATH_METADATA, controller.refresh);

      expect(method).toEqual(RequestMethod.POST);
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
