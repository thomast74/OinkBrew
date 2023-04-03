import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import * as argon2 from 'argon2';
import { Model } from 'mongoose';
import * as request from 'supertest';

import {
  closeDatabaseE2E,
  connectDatabaseE2E,
  getConfigurationModel,
  getDeviceModel,
  getUserModel,
} from '../../test/db-helper.fn';
import {
  createAccessToken,
  createRefreshToken,
  sleep,
  TestingLogger,
} from '../../test/helper.fn';
import { AppModule } from '../app.module';
import { ARGON_OPTIONS } from '../constants';
import { Device } from '../devices/schemas';
import { User } from '../users/schemas';
import { createUserInDb } from '../users/tests/users-helper.mock';
import { Configuration } from './schemas';
import {
  expectedConfigurationBrewArchived,
  expectedConfigurationBrewNotArchived,
} from './tests/brew-configurations.mock';
import { createConfigurations } from './tests/configuration-helper.mock';
import { expectedConfigurationFridgeNotArchived } from './tests/fridge-configurations.mock';

describe('ConfigurationsController (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let user: User | null;
  let refreshToken: string;
  let hashedRt: string;
  let validAccessToken: string;
  let userModel: Model<User>;
  let confModel: Model<Configuration>;
  let deviceModel: Model<Device>;

  beforeAll(async () => {
    await connectDatabaseE2E();

    userModel = getUserModel();
    deviceModel = getDeviceModel();
    confModel = getConfigurationModel();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .setLogger(new TestingLogger())
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        disableErrorMessages: true,
      }),
    );
    await app.init();

    jwt = moduleFixture.get<JwtService>(JwtService);

    await prepareUserInDb();
    await prepareConfigurationsInDb();
    await sleep(10000);
  });

  const prepareUserInDb = async () => {
    const userDocument = await createUserInDb(userModel, true);
    refreshToken = await createRefreshToken(jwt, user?.id, user?.email);
    hashedRt = await argon2.hash(refreshToken, ARGON_OPTIONS);

    if (userDocument) {
      userDocument.hashedRt = hashedRt;
      userDocument.save();
    }

    validAccessToken = await createAccessToken(jwt, user?.id, user?.email);
  };

  const prepareConfigurationsInDb = async () => {
    await createConfigurations(deviceModel, confModel);
  };

  afterAll(async () => {
    await closeDatabaseE2E();
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
        expectedConfigurationBrewNotArchived,
        expectedConfigurationFridgeNotArchived,
      ]);
    });

    it('should get active configurations stored in database if query string with false provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/configurations?archived=false')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send();

      expect(response.body).toBeArrayOfSize(2);
      expect(response.body).toIncludeAllMembers([
        expectedConfigurationBrewNotArchived,
        expectedConfigurationFridgeNotArchived,
      ]);
    });

    it('should get archived configurations stored in database if query string with true provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/configurations?archived=true')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send();

      expect(response.body).toBeArrayOfSize(1);
      expect(response.body).toIncludeAllMembers([
        expectedConfigurationBrewArchived,
      ]);
    });

    it('should return bad request if archived query string is malformed', () => {
      return request(app.getHttpServer())
        .get('/configurations?archived=blabla')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(400);
    });
  });
});
