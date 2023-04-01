import { HttpException, HttpStatus, RequestMethod } from '@nestjs/common';
import {
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import {
  dbConfigurationBrew,
  dbConfigurationFridge,
} from '../../test/db-helper.fn';
import { IS_PUBLIC_KEY } from '../auth/decorators';
import { ConfigurationsController } from './configurations.controller';
import { ConfigurationsService } from './configurations.service';

describe('ConfigurationsController', () => {
  let module: TestingModule;

  const mockConfigurationsService = {
    findAll: jest.fn(),
    update: jest.fn(),
    updateConnectedDeviceWithNameAndOffset: jest.fn(),
    restart: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [ConfigurationsController],
      providers: [ConfigurationsService],
    })
      .overrideProvider(ConfigurationsService)
      .useValue(mockConfigurationsService)
      .compile();
  });

  describe('GET /', () => {
    it('should not be public', () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      const metadata = Reflect.getMetadata(
        IS_PUBLIC_KEY,
        controller.getListOfConfigurations,
      );

      expect(metadata).toBeUndefined();
    });

    it('should react to Get /', () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      const method = Reflect.getMetadata(
        METHOD_METADATA,
        controller.getListOfConfigurations,
      );
      const path = Reflect.getMetadata(
        PATH_METADATA,
        controller.getListOfConfigurations,
      );

      expect(method).toEqual(RequestMethod.GET);
      expect(path).toEqual('/');
    });

    it('should return HttpStatus.OK', () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      const metadata = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        controller.getListOfConfigurations,
      );

      expect(metadata).toEqual(HttpStatus.OK);
    });

    it('should call service with only active configurations as default', async () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );

      await controller.getListOfConfigurations();

      expect(mockConfigurationsService.findAll).toHaveBeenCalledWith(false);
    });

    it('should call service with provided option for archive status', async () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );

      await controller.getListOfConfigurations(true);

      expect(mockConfigurationsService.findAll).toHaveBeenCalledWith(true);
    });

    it('should return an array of configurations', async () => {
      const expectedConfigurations = [
        dbConfigurationBrew,
        dbConfigurationFridge,
      ];
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      mockConfigurationsService.findAll.mockResolvedValue(
        expectedConfigurations,
      );

      const response = await controller.getListOfConfigurations();

      expect(response).toBe(expectedConfigurations);
    });

    it('should return error in case backend has an error', async () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      mockConfigurationsService.findAll.mockRejectedValue('db error');

      await expect(controller.getListOfConfigurations()).rejects.toEqual(
        new HttpException('db error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });
});
