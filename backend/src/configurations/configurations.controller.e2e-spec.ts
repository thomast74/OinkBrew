import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import * as request from 'supertest';
import {
  createConfigurations,
  createUser,
  expectedConfigurationBrew,
  expectedConfigurationBrew2,
  expectedConfigurationFridge,
  updateUser,
} from '../../test/db-helper.fn';
import {
  createAccessToken,
  createRefreshToken,
  sleep,
} from '../../test/helper.fn';
import { AppModule } from '../app.module';
import { ARGON_OPTIONS } from '../constants';
import { PrismaService } from '../prisma/prisma.service';

describe('ConfigurationsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let user: User | null;
  let refreshToken: string;
  let hashedRt: string;
  let validAccessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        disableErrorMessages: true,
      }),
    );
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwt = moduleFixture.get<JwtService>(JwtService);

    await prepareUserInDb();
    await prepareConfigurationsInDb();
    await sleep(10000);
  });

  const prepareUserInDb = async () => {
    user = await createUser(prisma, true);
    refreshToken = await createRefreshToken(jwt, user?.id, user?.email);
    hashedRt = await argon2.hash(refreshToken, ARGON_OPTIONS);
    await updateUser(prisma, user?.id, { hashedRt });
    validAccessToken = await createAccessToken(jwt, user?.id, user?.email);
  };

  const prepareConfigurationsInDb = async () => {
    await createConfigurations(prisma);
  };

  afterAll(async () => {
    const deleteUsers = prisma.client.user.deleteMany();
    const deleteDevices = prisma.client.device.deleteMany();
    await prisma.client.$transaction([deleteUsers, deleteDevices]);

    await app.close();
  });

  describe('GET /configurations', () => {
    it('should return not authenticated if no valid token provided', () => {
      return request(app.getHttpServer()).get('/configurations').expect(401);
    });

    it('should get active configurations stored in database if no query string provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/configurations')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send();

      expect(response.body).toBeArrayOfSize(2);
      expect(response.body).toIncludeAllMembers([
        expectedConfigurationBrew,
        expectedConfigurationFridge,
      ]);
    });

    it('should get active configurations stored in database if query string with false provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/configurations?archived=false')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send();

      expect(response.body).toBeArrayOfSize(2);
      expect(response.body).toIncludeAllMembers([
        expectedConfigurationBrew,
        expectedConfigurationFridge,
      ]);
    });

    it('should get archived configurations stored in database if query string with true provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/configurations?archived=true')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send();

      expect(response.body).toBeArrayOfSize(1);
      expect(response.body).toIncludeAllMembers([expectedConfigurationBrew2]);
    });

    it('should return bad request if archived query string is malformed', () => {
      return request(app.getHttpServer())
        .get('/configurations?archived=blabla')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(400);
    });
  });
});
