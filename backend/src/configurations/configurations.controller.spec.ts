import {
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  RequestMethod,
} from '@nestjs/common';
import {
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';

import { IS_PUBLIC_KEY } from '../auth/decorators';
import { ConfigurationsController } from './configurations.controller';
import { ConfigurationsService } from './configurations.service';
import { BrewConfigurationDto, FridgeConfigurationDto } from './dtos';
import { mockBrewNotArchived } from './tests/brew-configurations.mock';
import { brewConfValid, fridgeConfValid } from './tests/configuration-dto.mock';
import { mockFridgeNotArchived } from './tests/fridge-configurations.mock';

describe('ConfigurationsController', () => {
  let module: TestingModule;

  const mockConfigurationsService = {
    findAll: jest.fn(),
    save: jest.fn(),
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
        mockBrewNotArchived,
        mockFridgeNotArchived,
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
        new InternalServerErrorException('db error'),
      );
    });
  });

  describe('POST /', () => {
    it('should not be public', () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      const metadata = Reflect.getMetadata(
        IS_PUBLIC_KEY,
        controller.createConfiguration,
      );

      expect(metadata).toBeUndefined();
    });

    it('should react to PUT /', () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      const method = Reflect.getMetadata(
        METHOD_METADATA,
        controller.createConfiguration,
      );
      const path = Reflect.getMetadata(
        PATH_METADATA,
        controller.createConfiguration,
      );

      expect(method).toEqual(RequestMethod.POST);
      expect(path).toEqual('/');
    });

    it('should return HttpStatus.CREATED', () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      const metadata = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        controller.createConfiguration,
      );

      expect(metadata).toEqual(HttpStatus.CREATED);
    });

    it('should call configuration service with valid brew configuration', async () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );

      await controller.createConfiguration(
        brewConfValid as BrewConfigurationDto,
      );

      expect(mockConfigurationsService.save).toHaveBeenCalledWith(
        brewConfValid,
      );
    });

    it('should call configuration service with valid fridge configuration', async () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );

      await controller.createConfiguration(
        fridgeConfValid as FridgeConfigurationDto,
      );

      expect(mockConfigurationsService.save).toHaveBeenCalledWith(
        fridgeConfValid,
      );
    });

    it('should return any error received from configration service', async () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      mockConfigurationsService.save.mockRejectedValue(
        new NotFoundException('Device not found'),
      );

      await expect(
        controller.createConfiguration(
          fridgeConfValid as FridgeConfigurationDto,
        ),
      ).rejects.toEqual(new NotFoundException('Device not found'));
    });

    it('should return created configuration document', async () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      mockConfigurationsService.save.mockResolvedValue(fridgeConfValid);

      const response = await controller.createConfiguration(
        fridgeConfValid as FridgeConfigurationDto,
      );

      expect(response).toEqual(fridgeConfValid);
    });
  });
});
