import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { authenticator } from 'otplib';
import { createDbdUser, userDto } from '../../test/helper.functions';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import jwtConfig from './config/jwt.config';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [jwtConfig],
        }),
      ],
      providers: [AuthService],
    })
      .useMocker((token) => {
        if (token === UsersService) {
          return {
            create: jest.fn().mockResolvedValue(undefined),
            updateRefreshToken: jest.fn().mockResolvedValue(void 0),
            findById: jest.fn().mockResolvedValue({}),
            findByEmail: jest.fn().mockResolvedValue(undefined),
          };
        }
        if (token === JwtService) {
          return {
            signAsync: jest.fn().mockImplementation(jwtServiceMockImpl),
          };
        }
      })
      .compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should get user object by email', async () => {
      await service.validateUser(userDto.email, '123456');

      expect(userService.findByEmail).toHaveBeenCalledWith(userDto.email);
    });

    it('should return null if user not found', async () => {
      const response = await service.validateUser(userDto.email, '123456');

      expect(response).toBe(null);
    });

    it('should return null if password does not match', async () => {
      const dbUser = await createDbdUser(userDto);
      (userService.findByEmail as jest.Mock).mockResolvedValue(dbUser);

      const response = await service.validateUser(userDto.email, '123456');

      expect(response).toBe(null);
    });

    it('should return user if password matches', async () => {
      const dbUser = await createDbdUser(userDto);
      (userService.findByEmail as jest.Mock).mockResolvedValue(dbUser);

      const response = await service.validateUser(
        userDto.email,
        userDto.password,
      );

      expect(response).toEqual({
        id: 3,
        email: 'test@user.de',
        otpConfirmed: false,
        otpSecret: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('signup', () => {
    it('should call user service to create user', async () => {
      const dbUser = await createDbdUser(userDto);
      (userService.create as jest.Mock).mockResolvedValue(dbUser);

      await service.signup(userDto);

      expect(userService.create).toHaveBeenCalledWith(userDto);
    });

    it('should return BadRequestException if user was not created', async () => {
      await expect(service.signup(userDto)).rejects.toEqual(
        new BadRequestException('User was not created'),
      );
    });

    it('should create otp token', async () => {
      const dbUser = await createDbdUser(userDto);
      (userService.create as jest.Mock).mockResolvedValue(dbUser);

      await service.signup(userDto);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(1);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: dbUser.id,
          email: dbUser.email,
        },
        {
          secret: process.env.JWT_OTP_TOKEN_SECRET,
          expiresIn: `${process.env.JWT_OTP_TOKEN_EXPIRATION_TIME}m`,
        },
      );
    });

    it('should not update user with refresh token', async () => {
      const dbUser = await createDbdUser(userDto);
      (userService.create as jest.Mock).mockResolvedValue(dbUser);

      await service.signup(userDto);

      expect(userService.updateRefreshToken).not.toHaveBeenCalled();
    });

    it('should return otp token, url and barcode', async () => {
      const dbUser = await createDbdUser(userDto);
      (userService.create as jest.Mock).mockResolvedValue(dbUser);

      const response = await service.signup(userDto);

      expect(response).toEqual({
        otpToken: 'new_otp_token',
        otpUrl: expect.stringMatching(
          /otpauth:\/\/totp\/OinkBrew:test%40user\.de\?secret=.*&period=30&digits=6&algorithm=SHA1&issuer=OinkBrew/,
        ),
        otpBarcode: expect.any(String),
        userId: 3,
      });
    });
  });

  describe('confirmOtp', () => {
    it('should load user from user service', async () => {
      const dbUser = await createDbdUser(userDto);
      (userService.findById as jest.Mock).mockResolvedValue(dbUser);
      const otpPassword = authenticator.generate(dbUser.otpSecret);

      await service.confirmOtp({ userId: dbUser.id, otpPassword }, true);

      expect(userService.findById).toHaveBeenCalledWith(dbUser.id);
    });

    it('should return BadRequestException if user was not found', async () => {
      const dbUser = await createDbdUser(userDto);
      (userService.findById as jest.Mock).mockResolvedValue(undefined);

      await expect(
        service.confirmOtp({ userId: dbUser.id, otpPassword: '123456' }),
      ).rejects.toEqual(new BadRequestException('User not valid'));
    });

    it('should return BadRequestException if user was not found', async () => {
      const dbUser = await createDbdUser(userDto);
      dbUser.otpSecret = '';
      (userService.findById as jest.Mock).mockResolvedValue(dbUser);

      await expect(
        service.confirmOtp({ userId: dbUser.id, otpPassword: '123456' }),
      ).rejects.toEqual(new BadRequestException('User not valid'));
    });

    it('should return BadRequestException if user already confirmed otp', async () => {
      const dbUser = await createDbdUser(userDto, 'rt', true);

      (userService.findById as jest.Mock).mockResolvedValue(dbUser);

      await expect(
        service.confirmOtp({ userId: dbUser.id, otpPassword: '123456' }, true),
      ).rejects.toEqual(new BadRequestException('User not valid'));
    });

    it('should return BadRequestException if user not confirmed otp but should be', async () => {
      const dbUser = await createDbdUser(userDto, 'rt', false);

      (userService.findById as jest.Mock).mockResolvedValue(dbUser);

      await expect(
        service.confirmOtp({ userId: dbUser.id, otpPassword: '123456' }, false),
      ).rejects.toEqual(new BadRequestException('User not valid'));
    });

    it('should return ForbiddenException if otp password is wrong', async () => {
      const dbUser = await createDbdUser(userDto);
      (userService.findById as jest.Mock).mockResolvedValue(dbUser);

      await expect(
        service.confirmOtp({ userId: dbUser.id, otpPassword: '123456' }, true),
      ).rejects.toEqual(new ForbiddenException('Access Denied'));
    });

    it('should return tokens if otp password is valid', async () => {
      const dbUser = await createDbdUser(userDto);
      (userService.findById as jest.Mock).mockResolvedValue(dbUser);
      const otpPassword = authenticator.generate(dbUser.otpSecret);

      const response = await service.confirmOtp(
        {
          userId: dbUser.id,
          otpPassword,
        },
        true,
      );

      expect(response).toEqual({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });
    });

    it('should update user with new refresh token and otp confirmed', async () => {
      const dbUser = await createDbdUser(userDto);
      (userService.findById as jest.Mock).mockResolvedValue(dbUser);
      const otpPassword = authenticator.generate(dbUser.otpSecret);

      await service.confirmOtp(
        {
          userId: dbUser.id,
          otpPassword,
        },
        true,
      );

      expect(userService.updateRefreshToken).toHaveBeenCalledWith(
        dbUser.id,
        'new_refresh_token',
        true,
      );
    });

    it('should update user with new refresh token and not update otp confirmed', async () => {
      const dbUser = await createDbdUser(userDto, 'rt', true);
      (userService.findById as jest.Mock).mockResolvedValue(dbUser);
      const otpPassword = authenticator.generate(dbUser.otpSecret);

      await service.confirmOtp(
        {
          userId: dbUser.id,
          otpPassword,
        },
        false,
      );

      expect(userService.updateRefreshToken).toHaveBeenCalledWith(
        dbUser.id,
        'new_refresh_token',
        false,
      );
    });
  });

  describe('signin', () => {
    it('should return BadRequestException if no user was provided', async () => {
      await expect(service.signin(null as any)).rejects.toEqual(
        new BadRequestException('User not signed up correctly'),
      );
    });

    it('should return BadRequestException if no user details were provided', async () => {
      await expect(service.signin({} as any)).rejects.toEqual(
        new BadRequestException('User not signed up correctly'),
      );
    });

    it('should return otp token and no barcode', async () => {
      const dbUser = await createDbdUser(userDto, 'rt', true);
      (userService.create as jest.Mock).mockResolvedValue(dbUser);

      const response = await service.signin(dbUser);

      expect(response).toEqual({
        otpToken: 'new_otp_token',
        otpBarcode: undefined,
        userId: 3,
      });
    });
  });

  describe('logout', () => {
    it('should call updateRefreshToken on user service', async () => {
      await service.logout(5);

      expect(userService.updateRefreshToken).toHaveBeenCalledWith(5);
    });
  });

  describe('refreshTokens', () => {
    it('should find user by user id', async () => {
      const dbUser = await createDbdUser(userDto, 'my_refresh_token');
      (userService.findById as jest.Mock).mockImplementation((userId) =>
        userServiceFindByIdMockImpl(dbUser, userId),
      );

      await service.refreshTokens(dbUser.id, 'my_refresh_token');

      expect(userService.findById).toHaveBeenCalledWith(dbUser.id);
    });

    it('should return ForbiddenException when user not found', async () => {
      const dbUser = await createDbdUser(userDto, 'my_refresh_token');
      (userService.findById as jest.Mock).mockImplementation((userId) =>
        userServiceFindByIdMockImpl(dbUser, userId),
      );

      await expect(
        service.refreshTokens(1, 'my_refresh_token'),
      ).rejects.toEqual(new ForbiddenException('Access Denied'));
    });

    it('should return ForbiddenException when user has no refresh token hash', async () => {
      const dbUser = await createDbdUser(userDto, 'my_refresh_token');
      dbUser.hashedRt = '';
      (userService.findById as jest.Mock).mockImplementation((userId) =>
        userServiceFindByIdMockImpl(dbUser, userId),
      );

      await expect(
        service.refreshTokens(dbUser.id, 'my_refresh_token'),
      ).rejects.toEqual(new ForbiddenException('Access Denied'));
    });

    it('should return ForbiddenException when refresh token hashes are not matching', async () => {
      const dbUser = await createDbdUser(userDto, 'my_refresh_token');
      (userService.findById as jest.Mock).mockImplementation((userId) =>
        userServiceFindByIdMockImpl(dbUser, userId),
      );

      await expect(
        service.refreshTokens(dbUser.id, 'old_refresh_token'),
      ).rejects.toEqual(new ForbiddenException('Access Denied'));
    });

    it('should update user with refresh token', async () => {
      const dbUser = await createDbdUser(userDto, 'my_refresh_token');
      (userService.findById as jest.Mock).mockImplementation((userId) =>
        userServiceFindByIdMockImpl(dbUser, userId),
      );
      (jwtService.signAsync as jest.Mock).mockImplementation(
        jwtServiceMockImpl,
      );

      await service.refreshTokens(dbUser.id, 'my_refresh_token');

      expect(userService.updateRefreshToken).toHaveBeenCalledWith(
        dbUser.id,
        'new_refresh_token',
        undefined,
      );
    });

    it('should return access and refresh token', async () => {
      const dbUser = await createDbdUser(userDto, 'my_refresh_token');
      (userService.findById as jest.Mock).mockImplementation((userId) =>
        userServiceFindByIdMockImpl(dbUser, userId),
      );
      (jwtService.signAsync as jest.Mock).mockImplementation(
        jwtServiceMockImpl,
      );

      const response = await service.refreshTokens(
        dbUser.id,
        'my_refresh_token',
      );

      expect(response).toEqual({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });
    });
  });
});

const userServiceFindByIdMockImpl = (dbUser, userId) => {
  if (userId === dbUser.id) {
    return Promise.resolve(dbUser);
  }
  return Promise.resolve(undefined);
};

const jwtServiceMockImpl = (_payload, options) => {
  if (options.secret === process.env.JWT_REFRESH_TOKEN_SECRET) {
    return Promise.resolve('new_refresh_token');
  } else if (options.secret === process.env.JWT_ACCESS_TOKEN_SECRET) {
    return Promise.resolve('new_access_token');
  } else if (options.secret === process.env.JWT_OTP_TOKEN_SECRET) {
    return Promise.resolve('new_otp_token');
  } else {
    return Promise.resolve(undefined);
  }
};
