import { getQueueToken } from '@nestjs/bull';
import { HttpStatus, RequestMethod } from '@nestjs/common';
import {
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { IS_PUBLIC_KEY } from '../auth/decorators';
import { DevicesController } from './devices.controller';
import { DevicesModule } from './devices.module';

describe('DevicesController', () => {
  let module: TestingModule;
  let mockDevicesQueue;

  beforeEach(async () => {
    mockDevicesQueue = {
      add: jest.fn(),
    };

    module = await Test.createTestingModule({
      imports: [DevicesModule],
    })
      .overrideProvider(getQueueToken('devices'))
      .useValue(mockDevicesQueue)
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

  describe('refresh', () => {
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
      expect(path).toEqual('refresh');
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
