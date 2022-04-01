import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { totp } from 'otplib';
import * as request from 'supertest';
import {
  createUser,
  findUserByEmail,
  updateUser,
} from '../../test/db-helper.functions';
import {
  createAccessToken,
  createOtpToken,
  createRefreshToken,
  userDto,
} from '../../test/helper.functions';
import { AppModule } from '../app.module';
import { ARGON_OPTIONS } from '../constants';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../users/types';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

  beforeEach(async () => {
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
  });

  afterEach(async () => {
    const deleteUsers = prisma.client.user.deleteMany();

    await prisma.client.$transaction([deleteUsers]);
    await prisma.client.$disconnect();
  });

  describe('signup', () => {
    it('should return UNAUTHORIZED and otp token if successful', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(userDto);

      expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
      expect(response.body).toEqual(expectedOtpBarcodeTokens);
    });

    it('should return BAD_REQUEST if no email was provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: 'funny' });

      expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
    });

    it('should return BAD_REQUEST if no password was provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: 'funny@test.de' });

      expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
    });

    it('should create user in database', async () => {
      await request(app.getHttpServer()).post('/auth/signup').send(userDto);

      const user = await findUserByEmail(prisma, userDto.email);

      expect(user).toBeDefined();
      expect(user).toEqual(userFreshlyCreated);
    });
  });

  describe('signupOtp', () => {
    let user: User | null;

    beforeEach(async () => {
      user = await createUser(prisma);
    });

    it('should return UNAUTHORIZED if no/wrong otp token provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signupOtp')
        .send({});

      expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
    });

    it('should return BAD_REQUEST if no user id provided', async () => {
      const otpToken = await createOtpToken(jwt, user?.id, user?.email);

      const response = await request(app.getHttpServer())
        .post('/auth/signupOtp')
        .set('Authorization', `Bearer ${otpToken}`)
        .send({});

      expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
    });

    it('should return BAD_REQUEST if no otp password provided', async () => {
      const otpToken = await createOtpToken(jwt, user?.id, user?.email);

      const response = await request(app.getHttpServer())
        .post('/auth/signupOtp')
        .set('Authorization', `Bearer ${otpToken}`)
        .send({ userId: user?.id });

      expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
    });

    it('should return UNAUTHORIZED if otp password is wrong', async () => {
      const otpToken = await createOtpToken(jwt, user?.id, user?.email);

      const response = await request(app.getHttpServer())
        .post('/auth/signupOtp')
        .set('Authorization', `Bearer ${otpToken}`)
        .send({ userId: user?.id, otpPassword: '123456' });

      expect(response.status).toEqual(HttpStatus.FORBIDDEN);
    });

    it('should return access and refres token if otp password is valid', async () => {
      const otpToken = await createOtpToken(jwt, user?.id, user?.email);
      const otpPassword = totp.generate(user?.otpSecret ?? '');

      const response = await request(app.getHttpServer())
        .post('/auth/signupOtp')
        .set('Authorization', `Bearer ${otpToken}`)
        .send({ userId: user?.id, otpPassword });

      expect(response.status).toEqual(HttpStatus.OK);
      expect(response.body).toEqual(expectedAccessTokens);
    });

    it('should set users refresh token', async () => {
      const otpToken = await createOtpToken(jwt, user?.id, user?.email);
      const otpPassword = totp.generate(user?.otpSecret ?? '');

      await request(app.getHttpServer())
        .post('/auth/signupOtp')
        .set('Authorization', `Bearer ${otpToken}`)
        .send({ userId: user?.id, otpPassword });

      const updatedUser = await findUserByEmail(prisma, user?.email ?? '');

      expect(updatedUser?.hashedRt).toBeDefined();
    });

    it('should set user as otp cofirmed', async () => {
      const otpToken = await createOtpToken(jwt, user?.id, user?.email);
      const otpPassword = totp.generate(user?.otpSecret ?? '');

      await request(app.getHttpServer())
        .post('/auth/signupOtp')
        .set('Authorization', `Bearer ${otpToken}`)
        .send({ userId: user?.id, otpPassword });

      const updatedUser = await findUserByEmail(prisma, user?.email ?? '');

      expect(updatedUser?.otpConfirmed).toBeTruthy();
    });
  });

  describe('signin', () => {
    it('should return UNAUTHORIZED if no email provided', async () => {
      const user = await createUser(prisma, true);

      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({});

      expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
    });

    it('should return UNAUTHORIZED if no password provided', async () => {
      const user = await createUser(prisma, true);

      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: user?.email,
        });

      expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
    });

    it('should return FORBIDDEN if password not matches', async () => {
      const user = await createUser(prisma, true);

      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: user?.email,
          password: '111222333',
        });

      expect(response.status).toEqual(HttpStatus.FORBIDDEN);
    });

    it('should return UNAUTHORIZED if otp is not confirmed', async () => {
      const user = await createUser(prisma, false);

      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: user?.email,
          password: '12345',
        });

      expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
      expect(response.body).toMatchObject({
        message: 'User not signed up correctly',
      });
    });

    it('should return UNAUTHORIZED and otp token if successful', async () => {
      const user = await createUser(prisma, true);

      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: user?.email,
          password: '12345',
        });

      expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
      expect(response.body).toEqual(expectedOtpTokens);
    });
  });

  describe('signinOtp', () => {
    let user: User | null;

    beforeEach(async () => {
      user = await createUser(prisma, true);
    });

    it('should return UNAUTHORIZED if no/wrong otp token provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signinOtp')
        .send({});

      expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
    });

    it('should return BAD_REQUEST if no user id provided', async () => {
      const otpToken = await createOtpToken(jwt, user?.id, user?.email);

      const response = await request(app.getHttpServer())
        .post('/auth/signinOtp')
        .set('Authorization', `Bearer ${otpToken}`)
        .send({});

      expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
    });

    it('should return BAD_REQUEST if no otp password provided', async () => {
      const otpToken = await createOtpToken(jwt, user?.id, user?.email);

      const response = await request(app.getHttpServer())
        .post('/auth/signinOtp')
        .set('Authorization', `Bearer ${otpToken}`)
        .send({ userId: user?.id });

      expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
    });

    it('should return UNAUTHORIZED if otp password is wrong', async () => {
      const otpToken = await createOtpToken(jwt, user?.id, user?.email);

      const response = await request(app.getHttpServer())
        .post('/auth/signinOtp')
        .set('Authorization', `Bearer ${otpToken}`)
        .send({ userId: user?.id, otpPassword: '123456' });

      expect(response.status).toEqual(HttpStatus.FORBIDDEN);
    });

    it('should return access and refresh token if otp password is valid', async () => {
      const otpToken = await createOtpToken(jwt, user?.id, user?.email);
      const otpPassword = totp.generate(user?.otpSecret ?? '');

      const response = await request(app.getHttpServer())
        .post('/auth/signinOtp')
        .set('Authorization', `Bearer ${otpToken}`)
        .send({ userId: user?.id, otpPassword });

      expect(response.status).toEqual(HttpStatus.OK);
      expect(response.body).toEqual(expectedAccessTokens);
    });

    it('should set users refresh token', async () => {
      const otpToken = await createOtpToken(jwt, user?.id, user?.email);
      const otpPassword = totp.generate(user?.otpSecret ?? '');

      await request(app.getHttpServer())
        .post('/auth/signinOtp')
        .set('Authorization', `Bearer ${otpToken}`)
        .send({ userId: user?.id, otpPassword });

      const updatedUser = await findUserByEmail(prisma, user?.email ?? '');

      expect(updatedUser?.hashedRt).toBeDefined();
      expect(updatedUser?.otpConfirmed).toBeTruthy();
    });
  });

  describe('logout', () => {
    let user: User | null;
    let refreshToken: string;

    beforeEach(async () => {
      user = await createUser(prisma, true);
      refreshToken = await createRefreshToken(jwt, user?.id, user?.email);
      const hashedRt = await argon2.hash(refreshToken, ARGON_OPTIONS);
      await updateUser(prisma, user?.id, { hashedRt });
    });

    it('should return UNAUTHORIZED if no access token provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({});

      expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
    });

    it('should return UNAUTHORIZED if no valid access token provided', async () => {
      const notValidToken = await createOtpToken(jwt, user?.id, user?.email);
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${notValidToken}`)
        .send({});

      expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
    });

    it('should return OK if valid access token was provided', async () => {
      const validAccessToken = await createAccessToken(
        jwt,
        user?.id,
        user?.email,
      );
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({});

      expect(response.status).toEqual(HttpStatus.OK);
    });

    it('should remove refresh token from user', async () => {
      const validAccessToken = await createAccessToken(
        jwt,
        user?.id,
        user?.email,
      );

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({});

      const dbUser = await findUserByEmail(prisma, userDto.email);

      expect(dbUser?.hashedRt).toBeNull();
    });
  });

  describe('refresh', () => {
    let user: User | null;
    let refreshToken: string;
    let hashedRt: string;

    beforeEach(async () => {
      user = await createUser(prisma, true);
      refreshToken = await createRefreshToken(jwt, user?.id, user?.email);
      hashedRt = await argon2.hash(refreshToken, ARGON_OPTIONS);
      await updateUser(prisma, user?.id, { hashedRt });
    });

    it('should return UNAUTHORIZED when no refresh token provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({});

      expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
    });

    it('should return UNAUTHORIZED if not valid refresh token provided', async () => {
      const notValidToken = await createAccessToken(jwt, user?.id, user?.email);

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${notValidToken}`)
        .send({});

      expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
    });

    it('should return FORBIDDEN if user not found', async () => {
      const validToken = await createRefreshToken(
        jwt,
        12345,
        'test@tester.org',
      );

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${validToken}`)
        .send({});

      expect(response.status).toEqual(HttpStatus.FORBIDDEN);
    });

    it('should return FORBIDDEN if user has no hashed refresh token', async () => {
      await updateUser(prisma, user?.id, { hashedRt: null });

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .send({});

      expect(response.status).toEqual(HttpStatus.FORBIDDEN);
    });

    it('should return FORBIDDEN if refresh token and hashedRT do not match', async () => {
      await updateUser(prisma, user?.id, { hashedRt: 'asdasdasd' });

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .send({});

      expect(response.status).toEqual(HttpStatus.FORBIDDEN);
    });

    it('should return OK if user found and refresh token matches', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .send({});

      expect(response.status).toEqual(HttpStatus.OK);
    });

    it('should return new access and refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .send({});

      expect(response.body).toEqual(expectedAccessTokens);
    });

    it('should have new hashedRt stored to user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .send({});

      const newRefreshToken = response.body.refresh_token;
      const dbUser = await findUserByEmail(prisma, userDto.email);
      const rtMatches = await argon2.verify(
        dbUser?.hashedRt ?? '',
        newRefreshToken,
        ARGON_OPTIONS,
      );

      expect(rtMatches).toBeTruthy();
    });
  });
});

const expectedOtpTokens = {
  otp_token: expect.any(String),
  otp_barcode: undefined,
  access_token: undefined,
  refresh_token: undefined,
};

const expectedOtpBarcodeTokens = {
  otp_token: expect.any(String),
  otp_barcode: expect.any(String),
  access_token: undefined,
  refresh_token: undefined,
};

const expectedAccessTokens = {
  otp_token: undefined,
  otp_barcode: undefined,
  access_token: expect.any(String),
  refresh_token: expect.any(String),
};

const userFreshlyCreated = {
  id: expect.any(Number),
  email: userDto.email,
  otpConfirmed: false,
  otpSecret: expect.any(String),
  hash: expect.any(String),
  hashedRt: null,
  createdAt: expect.any(Date),
  updatedAt: expect.any(Date),
};
