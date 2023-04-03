import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as request from 'supertest';

import { TestingLogger } from '../test/helper.fn';
import { AppModule } from './app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .setLogger(new TestingLogger())
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /profile', () => {
    // TODO make it work with an JWT Access Token
    it('should return not authenticated when no valid token provided', () => {
      return request(app.getHttpServer()).get('/profile').expect(401);
    });
  });
});
