import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as argon2 from 'argon2';
import { prismaMock } from '../../prisma-singleton';
import { createDbdUser, userDto } from '../../test/helper.fn';
import { ARGON_OPTIONS } from '../constants';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  beforeEach(() => {
    ARGON_OPTIONS.salt = Buffer.from('test salt');
  });

  afterEach(() => {
    ARGON_OPTIONS.salt = undefined;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    })
      .useMocker((token) => {
        if (token === PrismaService) {
          return { client: prismaMock };
        }
      })
      .compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user from AuthDto', async () => {
      const expectedUser = await createDbdUser(userDto);
      prismaMock.user.create.mockResolvedValue(expectedUser);

      const user = await service.create(userDto);

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: userDto.email,
          hash: expectedUser.hash,
          otpSecret: expect.any(String),
        },
      });
      expect(user).toBe(expectedUser);
    });

    it('should return forbidden exception for db connection errors', async () => {
      prismaMock.user.create.mockRejectedValue(
        new PrismaClientKnownRequestError('', 'P2002', '2'),
      );

      await expect(service.create(userDto)).rejects.toEqual(
        new ForbiddenException('Credentials incorrect'),
      );
    });

    it('should return error for every non connection errors', async () => {
      prismaMock.user.create.mockRejectedValue(new Error('something'));

      await expect(service.create(userDto)).rejects.toEqual(
        new Error('something'),
      );
    });
  });

  describe('updateRefreshToken', () => {
    it('should update user with new hashed refresh token', async () => {
      const refreshToken = 'new refreh token';
      const hash = await argon2.hash(refreshToken, ARGON_OPTIONS);

      await service.updateRefreshToken('1', refreshToken);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: {
          id: '1',
        },
        data: {
          hashedRt: hash,
        },
      });
    });

    it('should update user with null refresh token if no token provided', async () => {
      await service.updateRefreshToken('2');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: {
          id: '2',
        },
        data: {
          hashedRt: null,
        },
      });
    });

    it('should also update otpConfirmed if provided', async () => {
      const refreshToken = 'new refreh token';
      const hash = await argon2.hash(refreshToken, ARGON_OPTIONS);

      await service.updateRefreshToken('1', refreshToken, true);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: {
          id: '1',
        },
        data: {
          otpConfirmed: true,
          hashedRt: hash,
        },
      });
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const expectedUser = await createDbdUser(userDto);
      prismaMock.user.findUnique.mockImplementation((call) => {
        if (call?.where?.id === '3') {
          return expectedUser;
        } else {
          return null as any;
        }
      });

      const receivedUser = await service.findById('3');

      expect(receivedUser).toBe(expectedUser);
    });

    it('should return undefined if user not found', async () => {
      const expectedUser = await createDbdUser(userDto);
      prismaMock.user.findUnique.mockImplementation((call) => {
        if (call?.where?.id === '3') {
          return expectedUser;
        } else {
          return undefined as any;
        }
      });

      const receivedUser = await service.findById('4');

      expect(receivedUser).toBeUndefined();
    });

    it('should return undefined if error', async () => {
      const error = 'not found error';
      prismaMock.user.findUnique.mockRejectedValue(error);

      const receivedUser = await service.findById('4');

      expect(receivedUser).toBeUndefined();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const expectedUser = await createDbdUser(userDto);
      prismaMock.user.findUnique.mockImplementation((call) => {
        if (call?.where?.email === userDto.email) {
          return expectedUser;
        } else {
          return null as any;
        }
      });

      const receivedUser = await service.findByEmail(userDto.email);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: userDto.email,
        },
      });
      expect(receivedUser).toBe(expectedUser);
    });

    it('should return undefined if user not found', async () => {
      const expectedUser = await createDbdUser(userDto);
      prismaMock.user.findUnique.mockImplementation((call) => {
        if (call?.where?.email === userDto.email) {
          return expectedUser;
        } else {
          return undefined as any;
        }
      });

      const receivedUser = await service.findByEmail('thisisme@test.de');

      expect(receivedUser).toBeUndefined();
    });

    it('should return undefined if error', async () => {
      const error = 'not found error';
      prismaMock.user.findUnique.mockRejectedValue(error);

      const receivedUser = await service.findByEmail('thisisme@test.de');

      expect(receivedUser).toBeUndefined();
    });
  });
});
