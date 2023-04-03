import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { faker } from '@faker-js/faker';
import * as argon2 from 'argon2';
import 'jest-extended';
import { Model } from 'mongoose';
import * as request from 'supertest';

import {
  closeDatabaseE2E,
  connectDatabaseE2E,
  getDeviceModel,
  getUserModel,
} from '../../test/db-helper.fn';
import {
  createAccessToken,
  createRefreshToken,
  sleep,
  TestingLogger,
} from '../../test/helper.fn';
import { getParticleDevice } from '../../test/particle-helper.fn';
import { AppModule } from '../app.module';
import { ARGON_OPTIONS } from '../constants';
import { User } from '../users/schemas';
import { createUserInDb } from '../users/tests/users-helper.mock';
import { Device } from './schemas';
import { createDeviceInDb, createDevices } from './tests/devices-helper.mock';
import {
  expectedDevice1,
  expectedDevice2,
  expectedDeviceDatabaseOffline,
  expectedDeviceDatabaseOnline,
  mockDeviceWithConnectedDevicesConnected,
} from './tests/devices.mock';

describe('DevicesController (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let refreshToken: string;
  let hashedRt: string;
  let validAccessToken: string;
  let userModel: Model<User>;
  let deviceModel: Model<Device>;

  beforeAll(async () => {
    await connectDatabaseE2E();
    userModel = getUserModel();
    deviceModel = getDeviceModel();

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
    await prepareDeviceInDb();
    await sleep(10000);
  });

  const prepareUserInDb = async () => {
    const userDocument = await createUserInDb(userModel, true);
    refreshToken = await createRefreshToken(
      jwt,
      userDocument?.id,
      userDocument?.email,
    );
    hashedRt = await argon2.hash(refreshToken, ARGON_OPTIONS);

    if (userDocument) {
      userDocument.hashedRt = hashedRt;
      await userDocument.save();
    }

    validAccessToken = await createAccessToken(
      jwt,
      userDocument?.id,
      userDocument?.email,
    );
  };

  const prepareDeviceInDb = async () => {
    await createDevices(deviceModel);
  };

  afterAll(async () => {
    await closeDatabaseE2E();
    await app.close();
  });

  describe('GET /devices', () => {
    it('should return not authenticated if no valid token provided', () => {
      return request(app.getHttpServer()).get('/devices').expect(401);
    });

    it('should get devices stored in database', async () => {
      const response = await request(app.getHttpServer())
        .get('/devices')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send();

      expect(response.body).toBeArrayOfSize(4);
      expect(response.body).toIncludeAllMembers([
        expectedDeviceDatabaseOffline,
        expectedDeviceDatabaseOnline,
        expectedDevice1,
        expectedDevice2,
      ]);
    });
  });

  describe('POST /devices/{id}/{hwAddress}/{pinNr}', () => {
    beforeEach(async () => {
      await createDeviceInDb(
        deviceModel,
        mockDeviceWithConnectedDevicesConnected,
      );
    });

    afterEach(async () => {
      deviceModel.deleteOne({ id: 'bbb' });
    });

    it('should return not authenticated if no valid token provided', () => {
      const deviceId = 'bbb';
      return request(app.getHttpServer())
        .post(`/devices/${deviceId}/000000000000/11`)
        .send({})
        .expect(401);
    });

    it('should return not found when pinNr missing', () => {
      const deviceId = 'bbb';
      return request(app.getHttpServer())
        .post(`/devices/${deviceId}/000000000000`)
        .send({})
        .expect(404);
    });

    it('should return bad request when name is empty', async () => {
      const deviceId = 'bbb';
      return request(app.getHttpServer())
        .post(`/devices/${deviceId}/000000000000/11`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          name: '',
          offset: 1.0,
        })
        .expect(400);
    });

    it('should return bad request when offset is missing', async () => {
      const deviceId = 'bbb';
      return request(app.getHttpServer())
        .post(`/devices/${deviceId}/000000000000/11`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          name: 'sensor name',
        })
        .expect(400);
    });

    it('should return ok when offset is 0', async () => {
      const deviceId = 'bbb';
      const response = await request(app.getHttpServer())
        .post(`/devices/${deviceId}/000000000000/11`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          name: 'sensor name',
          offset: 0.0,
        });

      expect(response.status).toBe(200);
    });

    it('should return not found device not found in database', async () => {
      return request(app.getHttpServer())
        .post(`/devices/unknown/000000000000/11`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          name: 'sensor name',
          offset: 0.0,
        })
        .expect(404);
    });

    it('should return not found sensor not found in database', async () => {
      const deviceId = 'bbb';
      return request(app.getHttpServer())
        .post(`/devices/${deviceId}/000000000000/3`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          name: 'sensor name',
          offset: 0.0,
        })
        .expect(404);
    });

    it('should return ok when offset is set on offline device', async () => {
      const deviceId = 'bbb';
      return request(app.getHttpServer())
        .post(`/devices/${deviceId}/000000000000/11`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          name: 'sensor name',
          offset: 0.8,
        })
        .expect(200);
    });

    it('should return internal error when particle update failed', async () => {
      const deviceId = 'ccc';
      const result = await request(app.getHttpServer())
        .post(`/devices/${deviceId}/00000000/8`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          name: 'sensor name',
          offset: 0.8,
        });

      const error = JSON.parse(result.text);
      expect(result.statusCode).toBe(500);
      expect(error.message).toBe(
        "403: I didn't recognize that device name or ID, try opening https://api.particle.io/v1/devices?access_token=undefined",
      );
    });

    // this test passes only when device connected with sensor
    // *
    // it('should update offset on Particle IO if device is running and device connected', async () => {
    //   const deviceId = '3b003d000747343232363230';
    //   const pinNr = 0;
    //   const hwAddress = '28107974060000AC';

    //   const response = await request(app.getHttpServer())
    //     .post(`/devices/${deviceId}/${hwAddress}/${pinNr}`)
    //     .set('Authorization', `Bearer ${validAccessToken}`)
    //     .send({
    //       name: 'sensor name',
    //       offset: 0.5,
    //     });

    //   const cDevice = await getParticleConnectedDevices(
    //     deviceId,
    //     pinNr,
    //     hwAddress,
    //   );

    //   expect(response.statusCode).toBe(200);
    //   expect(cDevice).toBeDefined();
    //   expect(cDevice?.deviceOffset).toBe(0.5);
    // });
  });

  describe('POST /devices/{id}/restart', () => {
    it('should return not authenticated if no valid token provided', () => {
      const deviceId = 'bbb';
      return request(app.getHttpServer())
        .post(`/devices/${deviceId}/restart`)
        .send({})
        .expect(401);
    });

    // this test passes only when device connected with sensor
    // *
    // it('should return ok when device restart was successful', async () => {
    //   const deviceId = '3b003d000747343232363230';
    //   return request(app.getHttpServer())
    //     .post(`/devices/${deviceId}/restart`)
    //     .set('Authorization', `Bearer ${validAccessToken}`)
    //     .send({})
    //     .expect(200);
    // });

    it('should return internal error when particle restart failed', async () => {
      const deviceId = 'bbb';
      const result = await request(app.getHttpServer())
        .post(`/devices/${deviceId}/restart`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({});

      const error = JSON.parse(result.text);
      expect(result.statusCode).toBe(500);
      expect(error.message).toBe(
        "403: I didn't recognize that device name or ID, try opening https://api.particle.io/v1/devices?access_token=undefined",
      );
    });
  });

  describe('POST /devices/{id}', () => {
    it('should return not authenticated if no valid token provided', () => {
      return request(app.getHttpServer())
        .post(`/devices/${expectedDevice1.id}`)
        .send({})
        .expect(401);
    });

    it('should return bad request when name is empty', async () => {
      return request(app.getHttpServer())
        .post(`/devices/${expectedDevice1.id}`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          name: '',
        })
        .expect(400);
    });

    it('should return not found when device with {id} is not found in database', async () => {
      return request(app.getHttpServer())
        .post(`/devices/notaknownid`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          name: 'a new name',
        })
        .expect(404);
    });

    it('should return bad request when name is null/undefined', async () => {
      return request(app.getHttpServer())
        .post(`/devices/${expectedDevice1.id}`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({})
        .expect(400);
    });

    it('should update name and notes in database', async () => {
      const name = faker.word.noun();
      const notes = faker.random.words(5);

      const response = await request(app.getHttpServer())
        .post(`/devices/${expectedDevice2.id}`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          name,
          notes,
        });

      const deviceDb = await deviceModel
        .findOne({ id: expectedDevice2.id })
        .exec();

      expect(response.statusCode).toEqual(200);
      expect(deviceDb?.name).toEqual(name);
      expect(deviceDb?.notes).toEqual(notes);
    });

    it('should update name and notes in ParticleIO', async () => {
      const name = faker.word.noun();
      const notes = faker.random.words(5);

      await request(app.getHttpServer())
        .post(`/devices/${expectedDevice2.id}`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          name,
          notes,
        });

      const device = await getParticleDevice(expectedDevice2.id);
      expect(device.name).toEqual(name);
      expect(device.notes).toEqual(notes);
    });
  });

  describe('PUT /devices/refresh', () => {
    beforeEach(async () => {
      await deviceModel.deleteMany().exec();
      const deviceCount = await deviceModel.count().exec();

      expect(deviceCount).toEqual(0);
    });

    it('should return not authenticated if no valid token provided', () => {
      return request(app.getHttpServer()).put('/devices/refresh').expect(401);
    });

    it('should get devices from ParticleIO', async () => {
      const response = await request(app.getHttpServer())
        .put('/devices/refresh')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send();
      await sleep(9000);

      const deviceCount = await deviceModel.count().exec();

      expect(response.statusCode).toEqual(200);
      expect(deviceCount).toEqual(2);
    });
  });
});
