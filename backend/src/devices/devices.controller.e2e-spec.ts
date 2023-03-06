import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { faker } from '@faker-js/faker';
import * as argon2 from 'argon2';
import 'jest-extended';
import * as request from 'supertest';
import {
  createDevice,
  createUser,
  deviceMockInDatabaseOfflineExpected,
  deviceMockInDatabaseOnlineExpected,
  findDeviceById,
  updateUser,
} from '../../test/db-helper.fn';
import {
  createAccessToken,
  createRefreshToken,
  sleep,
} from '../../test/helper.fn';
import { getParticleDevice } from '../../test/particle-helper.fn';
import { AppModule } from '../app.module';
import { ARGON_OPTIONS } from '../constants';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../users/types';

describe('DevicesController (e2e)', () => {
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
    await prepareDeviceInDb();
    await sleep(10000);
  });

  const prepareUserInDb = async () => {
    user = await createUser(prisma, true);
    refreshToken = await createRefreshToken(jwt, user?.id, user?.email);
    hashedRt = await argon2.hash(refreshToken, ARGON_OPTIONS);
    await updateUser(prisma, user?.id, { hashedRt });
    validAccessToken = await createAccessToken(jwt, user?.id, user?.email);
  };

  const prepareDeviceInDb = async () => {
    await createDevice(prisma);
  };

  afterAll(async () => {
    const deleteUsers = prisma.client.user.deleteMany();
    const deleteDevices = prisma.client.device.deleteMany();
    await prisma.client.$transaction([deleteUsers, deleteDevices]);

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

      expect(response.body).toHaveLength(4);
      expect(response.body).toEqual([
        deviceMockInDatabaseOfflineExpected,
        deviceMockInDatabaseOnlineExpected,
        expectedDevice1,
        expectedDevice2,
      ]);
    });
  });

  describe('POST /devices/{id}/{hwAddress}/{pinNr}', () => {
    it('should return not authenticated if no valid token provided', () => {
      const deviceId = 'bbb';
      return request(app.getHttpServer())
        .post(`/devices/${deviceId}/0000000000000000/17`)
        .send({})
        .expect(401);
    });

    it('should return not found when pinNr missing', () => {
      const deviceId = 'bbb';
      return request(app.getHttpServer())
        .post(`/devices/${deviceId}/0000000000000000`)
        .send({})
        .expect(404);
    });

    it('should return bad request when name is empty', async () => {
      const deviceId = 'bbb';
      return request(app.getHttpServer())
        .post(`/devices/${deviceId}/00000000/8`)
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
        .post(`/devices/${deviceId}/00000000/8`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          name: 'sensor name',
        })
        .expect(400);
    });

    it('should return ok when offset is 0', async () => {
      const deviceId = 'bbb';
      const response = await request(app.getHttpServer())
        .post(`/devices/${deviceId}/00000000/8`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          name: 'sensor name',
          offset: 0.0,
        });

      expect(response.status).toBe(200);
    });

    it('should return not found device not found in database', async () => {
      return request(app.getHttpServer())
        .post(`/devices/unknown/00000000/8`)
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
        .post(`/devices/${deviceId}/00000000/3`)
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
        .post(`/devices/${deviceId}/00000000/8`)
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
      const device = await findDeviceById(prisma, expectedDevice2.id);

      expect(response.statusCode).toEqual(200);
      expect(device?.name).toEqual(name);
      expect(device?.notes).toEqual(notes);
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
      const deleteDevices = prisma.client.device.deleteMany();
      await prisma.client.$transaction([deleteDevices]);
      const deviceCount = await prisma.client.device.count();

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
      const deviceCount = await prisma.client.device.count();

      expect(response.statusCode).toEqual(200);
      expect(deviceCount).toEqual(2);
    });
  });
});

const expectedDevice1 = {
  cellular: false,
  connected: expect.any(Boolean),
  connectedDevices: expect.any(Array),
  createdAt: expect.any(String),
  current_build_target: '3.3.1',
  default_build_target: '2.3.1',
  firmwareVersion: expect.toBeOneOf([null, expect.anything()]),
  firmware_updates_enabled: true,
  firmware_updates_forced: false,
  functions: ['setConfig'],
  id: '3b003d000747343232363230',
  last_handshake_at: expect.any(String),
  last_heard: expect.any(String),
  last_ip_address: expect.any(String),
  name: expect.any(String),
  notes: expect.nullOrAny(String),
  online: expect.any(Boolean),
  pinned_build_target: '2.1.0',
  platform_id: 6,
  product_id: 6,
  serial_number: 'PH-150624-K34T-0',
  shieldVersion: expect.toBeOneOf([null, expect.anything()]),
  status: 'normal',
  system_firmware_version: '3.3.1',
  updatedAt: expect.any(String),
  variables: {
    Configurations: 'string',
    Devices: 'string',
    ShieldVersion: 'int32',
    Version: 'string',
  },
};

const expectedDevice2 = {
  cellular: false,
  connected: expect.any(Boolean),
  connectedDevices: expect.any(Array),
  createdAt: expect.any(String),
  current_build_target: '2.1.0',
  default_build_target: '2.3.1',
  firmwareVersion: expect.toBeOneOf([null, expect.anything()]),
  firmware_updates_enabled: true,
  firmware_updates_forced: false,
  functions: [],
  id: '280025000447343232363230',
  last_handshake_at: expect.any(String),
  last_heard: expect.any(String),
  last_ip_address: expect.any(String),
  name: expect.any(String),
  notes: expect.nullOrAny(String),
  online: expect.any(Boolean),
  pinned_build_target: null,
  platform_id: 6,
  product_id: 6,
  serial_number: 'PH-150623-YC2D-0',
  shieldVersion: expect.toBeOneOf([null, expect.anything()]),
  status: 'normal',
  system_firmware_version: '2.1.0',
  updatedAt: expect.any(String),
  variables: {},
};
