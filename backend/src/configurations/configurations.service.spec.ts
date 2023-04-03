import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { Model } from 'mongoose';

import {
  clearDatabase,
  clearDatabaseCollections,
  closeDatabase,
  connectDatabase,
  getConfigurationModel,
  getDeviceModel,
} from '../../test/db-helper.fn';
import { ParticleService } from '../common/particle.service';
import { Device } from '../devices/schemas';
import { ConfigurationsService } from './configurations.service';
import { Configuration } from './schemas';
import {
  mockBrewArchived,
  mockBrewNotArchived,
} from './tests/brew-configurations.mock';
import { createConfInDb } from './tests/configuration-helper.mock';
import { mockFridgeNotArchived } from './tests/fridge-configurations.mock';

describe('ConfigurationsService', () => {
  let service: ConfigurationsService;
  let confModel: Model<Configuration>;
  let deviceModel: Model<Device>;

  beforeAll(async () => {
    await connectDatabase();

    deviceModel = getDeviceModel();
    confModel = getConfigurationModel();

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationsService,
        ParticleService,
        {
          provide: getModelToken(Configuration.name),
          useValue: confModel,
        },
      ],
    })
      // .overrideProvider(ParticleService)
      // .useValue(mockParticleService)
      .compile();

    service = app.get<ConfigurationsService>(ConfigurationsService);
  });

  beforeEach(async () => {
    await connectDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should call db to get all active configurations', async () => {
      await createConfInDb(deviceModel, confModel, mockBrewNotArchived);
      await createConfInDb(deviceModel, confModel, mockBrewArchived);
      await createConfInDb(deviceModel, confModel, mockFridgeNotArchived);

      const response = await service.findAll(false);

      expect(response).toHaveLength(2);
      expect(response[0].name).toEqual('aaa');
      expect(response[1].name).toEqual('ccc');
    });

    it('should call prisma to get all archived configurations', async () => {
      await createConfInDb(deviceModel, confModel, mockBrewNotArchived);
      await createConfInDb(deviceModel, confModel, mockBrewArchived);
      await createConfInDb(deviceModel, confModel, mockFridgeNotArchived);

      const response = await service.findAll(true);

      expect(response).toHaveLength(1);
      expect(response[0].name).toEqual('bbb');
    });

    it('should return empty array in case no configurations found', async () => {
      await createConfInDb(deviceModel, confModel, mockBrewNotArchived);
      await createConfInDb(deviceModel, confModel, mockFridgeNotArchived);

      const response = await service.findAll(true);

      expect(response).toHaveLength(0);
    });

    it('should return empty array in case mongo error', async () => {
      await clearDatabaseCollections();

      const response = await service.findAll(false);

      expect(response).toHaveLength(0);
    });
  });
});
