import { Test } from '@nestjs/testing';
import { prismaMock } from '../../prisma-singleton';
import {
  dbConfigurationBrew,
  dbConfigurationFridge,
} from '../../test/db-helper.fn';
import { ParticleService } from '../common/particle.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigurationsService } from './configurations.service';

describe('ConfigurationsService', () => {
  let service: ConfigurationsService;

  const mockParticleService = {};

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ConfigurationsService, ParticleService],
    })
      .useMocker((token) => {
        if (token === PrismaService) {
          return { client: prismaMock };
        }
      })
      .overrideProvider(ParticleService)
      .useValue(mockParticleService)
      .compile();

    service = module.get<ConfigurationsService>(ConfigurationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should call prisma to get all active configurations', async () => {
      await service.findAll(false);

      expect(prismaMock.configuration.findMany).toHaveBeenCalledWith({
        where: {
          archived: false,
        },
      });
    });

    it('should call prisma to get all archived configurations', async () => {
      await service.findAll(true);

      expect(prismaMock.configuration.findMany).toHaveBeenCalledWith({
        where: {
          archived: true,
        },
      });
    });

    it('should return found devices', async () => {
      const expectedConfigurations = [
        dbConfigurationBrew,
        dbConfigurationFridge,
      ];
      prismaMock.configuration.findMany.mockResolvedValue(
        expectedConfigurations,
      );

      const receivedDevices = await service.findAll(false);

      expect(receivedDevices).toEqual(expectedConfigurations);
    });

    it('should return error from prisma client', async () => {
      prismaMock.configuration.findMany.mockRejectedValue(
        new Error('db error'),
      );

      await expect(service.findAll(false)).rejects.toEqual(
        new Error('db error'),
      );
    });
  });
});
