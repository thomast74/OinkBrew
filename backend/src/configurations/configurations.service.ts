import { Injectable } from '@nestjs/common';
import { Configuration } from '@prisma/client';
import { ParticleService } from '../common/particle.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfigurationsService {
  constructor(
    private prisma: PrismaService,
    private particle: ParticleService,
  ) {}

  public async findAll(archived: boolean): Promise<Configuration[]> {
    return await this.prisma.client.configuration.findMany({
      where: {
        archived,
      },
    });
  }
}
