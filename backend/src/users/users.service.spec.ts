import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import * as argon2 from 'argon2';
import { Model, Types } from 'mongoose';

import {
  clearDatabase,
  clearDatabaseCollections,
  closeDatabase,
  connectDatabase,
  getUserModel,
} from '../../test/db-helper.fn';
import { ARGON_OPTIONS } from '../constants';
import { UserAlreadyExists, UserNotFoundException } from './exceptions';
import { User } from './schemas';
import { createUser, createUserInDb, userDto } from './tests/users-helper.mock';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let userModel: Model<User>;

  beforeAll(async () => {
    await connectDatabase();

    userModel = getUserModel();

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    service = app.get<UsersService>(UsersService);
  });

  beforeEach(async () => {
    ARGON_OPTIONS.salt = Buffer.from('test salt');

    await connectDatabase();
  });

  afterEach(async () => {
    ARGON_OPTIONS.salt = undefined;

    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user from AuthDto', async () => {
      const newUser = await createUser(false);
      const expectedUser = {
        ...newUser,
        __v: 0,
        _id: expect.any(Types.ObjectId),
        id: expect.any(String),
        otpSecret: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      const user = (await service.create(userDto)).toJSON();

      expect(user).toEqual(expectedUser);
    });

    it('should return UserAlreadyExists if email is already in use', async () => {
      await createUserInDb(userModel, false);

      await expect(service.create(userDto)).rejects.toEqual(
        new UserAlreadyExists(),
      );
    });

    it('should return BadRequestException in case of database error', async () => {
      await closeDatabase();

      await expect(service.create(userDto)).rejects.toEqual(
        new BadRequestException(),
      );

      await connectDatabase();
    });
  });

  describe('updateRefreshToken', () => {
    it('should return UserNotFoundException if user not found', async () => {
      await expect(service.updateRefreshToken('anyString')).rejects.toEqual(
        new UserNotFoundException(),
      );
    });

    it('should update user with new hashed refresh token', async () => {
      const refreshToken = 'new refreh token';
      const hash = await argon2.hash(refreshToken, ARGON_OPTIONS);
      const newUser = await createUserInDb(userModel, false);
      const createdUser = {
        ...newUser?.toJSON(),
        hashedRt: hash,
        updatedAt: expect.any(Date),
      };

      const updatedUser = (
        await service.updateRefreshToken(
          newUser?.id.toString() ?? '',
          refreshToken,
        )
      ).toJSON();

      expect(updatedUser).toEqual(createdUser);
    });

    it('should update user with null refresh token if no token provided', async () => {
      const newUser = await createUserInDb(userModel, false);
      const createdUser = {
        ...newUser?.toJSON(),
        updatedAt: expect.any(Date),
      };
      delete createdUser.hashedRt;

      const updatedUser = (
        await service.updateRefreshToken(newUser?.id.toString() ?? '')
      ).toJSON();

      expect(updatedUser).toEqual(createdUser);
    });

    it('should also update otpConfirmed if provided', async () => {
      const refreshToken = 'new refreh token';
      const hash = await argon2.hash(refreshToken, ARGON_OPTIONS);
      const newUser = await createUserInDb(userModel, false);
      const createdUser = {
        ...newUser?.toJSON(),
        hashedRt: hash,
        otpConfirmed: true,
        updatedAt: expect.any(Date),
      };

      const updatedUser = (
        await service.updateRefreshToken(
          newUser?.id.toString() ?? '',
          refreshToken,
          true,
        )
      ).toJSON();

      expect(updatedUser).toEqual(createdUser);
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const expectedUser = await createUserInDb(userModel, false);

      const receivedUser = await service.findById(expectedUser?.id ?? '');

      expect(receivedUser).toBeDefined();
      expect(receivedUser).toEqual(expectedUser);
    });

    it('should return null if user not found', async () => {
      await createUserInDb(userModel, false);

      const receivedUser = await service.findById('anyString');

      expect(receivedUser).toBeNull();
    });

    it('should return null if error', async () => {
      const createdUser = await createUserInDb(userModel, false);
      await clearDatabaseCollections();

      const receivedUser = await service.findById(createdUser?.id ?? '');

      expect(receivedUser).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const expectedUser = await createUserInDb(userModel, false);

      const receivedUser = await service.findByEmail(expectedUser?.email ?? '');

      expect(receivedUser).toEqual(expectedUser);
    });

    it('should return null if user not found', async () => {
      const receivedUser = await service.findByEmail('thisisme@test.de');

      expect(receivedUser).toBeNull();
    });

    it('should return null if error', async () => {
      const expectedUser = await createUserInDb(userModel, false);
      await clearDatabaseCollections();

      const receivedUser = await service.findByEmail(expectedUser?.email ?? '');

      expect(receivedUser).toBeNull();
    });
  });
});
