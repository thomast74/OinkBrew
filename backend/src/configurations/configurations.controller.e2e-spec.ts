import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import * as argon2 from 'argon2';
import { Model } from 'mongoose';
import request from 'supertest';

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
  mockDtoBrewGood,
  mockDtoBrewMissingDevice,
} from './tests/brew-configurations.mock';
import {
  createConfFromDto,
  createConfigurations,
} from './tests/configuration-helper.mock';
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

  describe('POST /configurations', () => {
    it('should return not authenticated if no valid token provided', () => {
      return request(app.getHttpServer()).post('/configurations').expect(401);
    });

    it('should return BadRequestExcpetion if configuration not valid', async () => {
      const confDto = {
        ...mockDtoBrewGood,
        temperature: -65,
        heaterPwm: -45,
      };

      const response = await request(app.getHttpServer())
        .post('/configurations')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(confDto);

      const error = JSON.parse(response.text);
      expect(response.statusCode).toBe(400);
      expect(error.message).toEqual([
        'heaterPwm must not be less than 0',
        'temperature must not be less than 0',
      ]);
    });

    it('should return NotFoundException of device not found', async () => {
      const response = await request(app.getHttpServer())
        .post('/configurations')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(mockDtoBrewMissingDevice);

      const error = JSON.parse(response.text);
      expect(response.statusCode).toBe(404);
      expect(error.message).toBe('Device not found');
    });

    it('should return NotFoundException if actuator/sensor not found', async () => {
      const confDto = {
        ...mockDtoBrewMissingDevice,
        deviceId: 'ccc',
      };
      const response = await request(app.getHttpServer())
        .post('/configurations')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(confDto);

      const error = JSON.parse(response.text);
      expect(response.statusCode).toBe(404);
      expect(error.message).toBe(
        'Connected Device not found: 0/MISSING000000000',
      );
    });

    it('should create the configuration in database', async () => {
      const confDto = {
        ...mockDtoBrewGood,
        deviceId: 'ddd',
      };
      const response = await request(app.getHttpServer())
        .post('/configurations')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(confDto);

      expect(response.statusCode).toBe(201);
      expect(response.body).toBeDefined();

      const confCount = await confModel.findOne({ id: 5 }).count().exec();
      expect(confCount).toEqual(1);
    });

    it('should return InertalServerErrorException if particle update failed', async () => {
      const confDto = {
        ...mockDtoBrewGood,
        deviceId: 'ccc',
      };
      const response = await request(app.getHttpServer())
        .post('/configurations')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(confDto);

      expect(response.statusCode).toBe(500);
      expect(response.body.info).toEqual(
        "I didn't recognize that device name or ID, try opening https://api.particle.io/v1/devices?access_token=undefined",
      );
    });
  });

  describe('PUT /configurations/{id}', () => {
    it('should return not authenticated if no valid token provided', () => {
      return request(app.getHttpServer()).put('/configurations/6').expect(401);
    });

    it('should return BadRequestExcpetion if configuration not valid', async () => {
      const confDto = {
        ...mockDtoBrewGood,
        temperature: -65,
        heaterPwm: -45,
      };

      const response = await request(app.getHttpServer())
        .put('/configurations/5')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(confDto);

      const error = JSON.parse(response.text);
      expect(response.statusCode).toBe(400);
      expect(error.message).toEqual([
        'heaterPwm must not be less than 0',
        'temperature must not be less than 0',
      ]);
    });

    it('should return NotFoundException of configuration not found', async () => {
      const response = await request(app.getHttpServer())
        .put('/configurations/22')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(mockDtoBrewMissingDevice);

      const error = JSON.parse(response.text);
      expect(response.statusCode).toBe(404);
      expect(error.message).toBe('Configuration not found');
    });

    it('should return NotFoundException of device not found', async () => {
      const upddateConfiguration = {
        ...mockDtoBrewMissingDevice,
        id: 20,
        name: 'device not found',
      };
      await createConfFromDto(deviceModel, confModel, {
        ...upddateConfiguration,
        deviceId: 'ccc',
      });

      const response = await request(app.getHttpServer())
        .put('/configurations/20')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(upddateConfiguration);

      const error = JSON.parse(response.text);
      expect(response.statusCode).toBe(404);
      expect(error.message).toBe('Device not found');
    });

    it('should return NotFoundException if actuator/sensor not found', async () => {
      const upddateConfiguration = {
        ...mockDtoBrewMissingDevice,
        id: 21,
        name: 'sensor missing',
        deviceId: 'ccc',
      };
      await createConfFromDto(deviceModel, confModel, {
        ...upddateConfiguration,
      });

      const response = await request(app.getHttpServer())
        .put('/configurations/21')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(upddateConfiguration);

      const error = JSON.parse(response.text);
      expect(response.statusCode).toBe(404);
      expect(error.message).toBe(
        'Connected Device not found: 0/MISSING000000000',
      );
    });

    it('should update the configuration in database', async () => {
      const upddateConfiguration = {
        ...mockDtoBrewGood,
        id: 22,
        name: 'normal update',
        deviceId: 'ddd',
      };
      await createConfFromDto(deviceModel, confModel, {
        ...upddateConfiguration,
        name: 'old name',
      });

      const response = await request(app.getHttpServer())
        .put('/configurations/22')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(upddateConfiguration);

      expect(response.statusCode).toBe(201);
      expect(response.body).toBeDefined();

      const updatedConf = await confModel.findOne({ id: 22 }).exec();
      expect(updatedConf?.name).toEqual('normal update');
    });

    it('should return InertalServerErrorException if particle update failed', async () => {
      const upddateConfiguration = {
        ...mockDtoBrewGood,
        id: 23,
        name: 'particle update',
        deviceId: 'ccc',
      };
      await createConfFromDto(deviceModel, confModel, {
        ...upddateConfiguration,
        name: 'old particle',
      });

      const response = await request(app.getHttpServer())
        .put('/configurations/23')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(upddateConfiguration);

      expect(response.statusCode).toBe(500);
      expect(response.body.info).toEqual(
        "I didn't recognize that device name or ID, try opening https://api.particle.io/v1/devices?access_token=undefined",
      );
    });
  });

  describe('DELETE /configurations/{id}', () => {
    it('should return not authenticated if no valid token provided', () => {
      return request(app.getHttpServer())
        .delete('/configurations/6')
        .expect(401);
    });

    it('should return NotFoundException of configuration not found', async () => {
      const response = await request(app.getHttpServer())
        .delete('/configurations/32')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(mockDtoBrewMissingDevice);

      expect(response.statusCode).toBe(404);
      const error = JSON.parse(response.text);

      expect(error.message).toBe('Configuration not found');
    });

    it('should update the configuration in database', async () => {
      const upddateConfiguration = {
        ...mockDtoBrewGood,
        id: 33,
        name: 'normal update',
        deviceId: 'ddd',
      };
      await createConfFromDto(deviceModel, confModel, {
        ...upddateConfiguration,
        name: 'old name',
      });

      const response = await request(app.getHttpServer())
        .delete('/configurations/33')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(upddateConfiguration);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeDefined();

      const updatedConf = await confModel.findOne({ id: 33 }).exec();
      expect(updatedConf?.archived).toBeTrue();
    });

    it('should return InertalServerErrorException if particle update failed', async () => {
      const upddateConfiguration = {
        ...mockDtoBrewGood,
        id: 34,
        name: 'particle update',
        deviceId: 'ccc',
      };
      await createConfFromDto(deviceModel, confModel, {
        ...upddateConfiguration,
        name: 'old particle',
      });

      const response = await request(app.getHttpServer())
        .delete('/configurations/34')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(upddateConfiguration);

      expect(response.statusCode).toBe(500);
      expect(response.body.info).toEqual(
        "I didn't recognize that device name or ID, try opening https://api.particle.io/v1/devices?access_token=undefined",
      );
    });
  });
});
