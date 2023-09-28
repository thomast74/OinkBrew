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
    update: jest.fn(),
    delete: jest.fn(),
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
      const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, controller.getList);

      expect(metadata).toBeUndefined();
    });

    it('should react to Get /', () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      const method = Reflect.getMetadata(METHOD_METADATA, controller.getList);
      const path = Reflect.getMetadata(PATH_METADATA, controller.getList);

      expect(method).toEqual(RequestMethod.GET);
      expect(path).toEqual('/');
    });

    it('should return HttpStatus.OK', () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      const metadata = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        controller.getList,
      );

      expect(metadata).toEqual(HttpStatus.OK);
    });

    it('should call service with only active configurations as default', async () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );

      await controller.getList();

      expect(mockConfigurationsService.findAll).toHaveBeenCalledWith(false);
    });

    it('should call service with provided option for archive status', async () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );

      await controller.getList(true);

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

      const response = await controller.getList();

      expect(response).toBe(expectedConfigurations);
    });

    it('should return error in case backend has an error', async () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      mockConfigurationsService.findAll.mockRejectedValue('db error');

      await expect(controller.getList()).rejects.toEqual(
        new InternalServerErrorException('db error'),
      );
    });
  });

  describe('POST /', () => {
    it('should not be public', () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, controller.create);

      expect(metadata).toBeUndefined();
    });

    it('should react to PUT /', () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      const method = Reflect.getMetadata(METHOD_METADATA, controller.create);
      const path = Reflect.getMetadata(PATH_METADATA, controller.create);

      expect(method).toEqual(RequestMethod.POST);
      expect(path).toEqual('/');
    });

    it('should return HttpStatus.CREATED', () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      const metadata = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        controller.create,
      );

      expect(metadata).toEqual(HttpStatus.CREATED);
    });

    it('should call configuration service with valid brew configuration', async () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );

      await controller.create(brewConfValid as BrewConfigurationDto);

      expect(mockConfigurationsService.save).toHaveBeenCalledWith(
        brewConfValid,
      );
    });

    it('should call configuration service with valid fridge configuration', async () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );

      await controller.create(fridgeConfValid as FridgeConfigurationDto);

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
        controller.create(fridgeConfValid as FridgeConfigurationDto),
      ).rejects.toEqual(new NotFoundException('Device not found'));
    });

    it('should return created configuration document', async () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      mockConfigurationsService.save.mockResolvedValue(fridgeConfValid);

      const response = await controller.create(
        fridgeConfValid as FridgeConfigurationDto,
      );

      expect(response).toEqual(fridgeConfValid);
    });
  });

  describe('PUT /{id}', () => {
    it('should not be public', () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, controller.update);

      expect(metadata).toBeUndefined();
    });

    it('should react to PUT /{id}', () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      const method = Reflect.getMetadata(METHOD_METADATA, controller.update);
      const path = Reflect.getMetadata(PATH_METADATA, controller.update);

      expect(method).toEqual(RequestMethod.PUT);
      expect(path).toEqual('/:id');
    });

    it('should return HttpStatus.CREATED', () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      const metadata = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        controller.update,
      );

      expect(metadata).toEqual(HttpStatus.CREATED);
    });

    it('should call configurations service with id and configuration', async () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );

      await controller.update(6, fridgeConfValid as FridgeConfigurationDto);

      expect(mockConfigurationsService.update).toHaveBeenCalledWith(
        6,
        fridgeConfValid,
      );
    });

    it('should return any error received from configration service', async () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      mockConfigurationsService.update.mockRejectedValue(
        new NotFoundException('Configuration not found'),
      );

      await expect(
        controller.update(6, fridgeConfValid as FridgeConfigurationDto),
      ).rejects.toEqual(new NotFoundException('Configuration not found'));
    });

    it('should return created configuration document', async () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      mockConfigurationsService.update.mockResolvedValue(fridgeConfValid);

      const response = await controller.update(
        6,
        fridgeConfValid as FridgeConfigurationDto,
      );

      expect(response).toEqual(fridgeConfValid);
    });
  });

  describe('DELETE /{id}', () => {
    it('should not be public', () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, controller.delete);

      expect(metadata).toBeUndefined();
    });

    it('should react to DELETE /{id}', () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      const method = Reflect.getMetadata(METHOD_METADATA, controller.delete);
      const path = Reflect.getMetadata(PATH_METADATA, controller.delete);

      expect(method).toEqual(RequestMethod.DELETE);
      expect(path).toEqual('/:id');
    });

    it('should return HttpStatus.OK', () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      const metadata = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        controller.delete,
      );

      expect(metadata).toEqual(HttpStatus.OK);
    });

    it('should call configurations service with id', async () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );

      await controller.delete(6);

      expect(mockConfigurationsService.delete).toHaveBeenCalledWith(6);
    });

    it('should return any error received from configration service', async () => {
      const controller = module.get<ConfigurationsController>(
        ConfigurationsController,
      );
      mockConfigurationsService.delete.mockRejectedValue(
        new NotFoundException('Configuration not found'),
      );

      await expect(controller.delete(6)).rejects.toEqual(
        new NotFoundException('Configuration not found'),
      );
    });
  });
});
