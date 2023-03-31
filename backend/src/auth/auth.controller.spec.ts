import { HttpStatus, RequestMethod } from '@nestjs/common';
import {
  GUARDS_METADATA,
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { createDbdUser, userDto } from '../../test/helper.fn';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from './decorators';
import { OtpDto } from './dtos';
import {
  JwtOtphAuthGuard,
  JwtRefreshAuthGuard,
  LogInAuthGuard,
} from './guards';
import { JwtPayloadWithRefreshToken, Tokens } from './types';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
    })
      .useMocker((token) => {
        if (token === AuthService) {
          return {
            signup: jest.fn(),
            confirmOtp: jest.fn(),
            signin: jest.fn(),
            logout: jest.fn(),
            refreshTokens: jest.fn(),
            validateUser: jest.fn(),
          };
        }
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should be public', () => {
      const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, controller.signup);

      expect(metadata).toEqual(true);
    });

    it('should react to POST signup', () => {
      const method = Reflect.getMetadata(METHOD_METADATA, controller.signup);
      const path = Reflect.getMetadata(PATH_METADATA, controller.signup);

      expect(method).toEqual(RequestMethod.POST);
      expect(path).toEqual('signup');
    });

    it('should return HttpStatus.OK', () => {
      const metadata = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        controller.signup,
      );

      expect(metadata).toEqual(HttpStatus.OK);
    });

    it('should call auth service with user dto', async () => {
      await controller.signup(userDto);

      expect(service.signup).toHaveBeenCalledWith(userDto);
    });

    it('should return token object', async () => {
      const expectedTokens = {
        otp_token: 'otp',
      } as Tokens;
      (service.signup as jest.Mock).mockResolvedValue(expectedTokens);

      const receivedToken = await controller.signup(userDto);

      expect(receivedToken).toEqual(expectedTokens);
    });
  });

  describe('signupOtp', () => {
    it('should be public', () => {
      const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, controller.signupOtp);

      expect(metadata).toEqual(true);
    });

    it('should react to POST signup', () => {
      const method = Reflect.getMetadata(METHOD_METADATA, controller.signupOtp);
      const path = Reflect.getMetadata(PATH_METADATA, controller.signupOtp);

      expect(method).toEqual(RequestMethod.POST);
      expect(path).toEqual('signupOtp');
    });

    it('should use guard JwtOtphAuthGuard', () => {
      const metadata = Reflect.getMetadata(
        GUARDS_METADATA,
        controller.signupOtp,
      );

      expect(metadata).toEqual([JwtOtphAuthGuard]);
    });

    it('should return HttpStatus.OK', () => {
      const metadata = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        controller.signupOtp,
      );

      expect(metadata).toEqual(HttpStatus.OK);
    });

    it('should call auth service with user dto', async () => {
      await controller.signupOtp(otpDto);

      expect(service.confirmOtp).toHaveBeenCalledWith(otpDto, true);
    });

    it('should return token object', async () => {
      const expectedTokens = {
        access_token: 'at',
        refresh_token: 'rt',
      } as Tokens;
      (service.confirmOtp as jest.Mock).mockResolvedValue(expectedTokens);

      const receivedToken = await controller.signupOtp(otpDto);

      expect(receivedToken).toEqual(expectedTokens);
    });
  });

  describe('signin', () => {
    it('should be public', () => {
      const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, controller.signin);

      expect(metadata).toEqual(true);
    });

    it('should react to POST signin', () => {
      const method = Reflect.getMetadata(METHOD_METADATA, controller.signin);
      const path = Reflect.getMetadata(PATH_METADATA, controller.signin);

      expect(method).toEqual(RequestMethod.POST);
      expect(path).toEqual('signin');
    });

    it('should return HttpStatus.OK', () => {
      const metadata = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        controller.signin,
      );

      expect(metadata).toEqual(HttpStatus.OK);
    });

    it('should use guard LogInAuthGuard', () => {
      const metadata = Reflect.getMetadata(GUARDS_METADATA, controller.signin);

      expect(metadata).toEqual([LogInAuthGuard]);
    });

    it('should call auth service signin', async () => {
      const user = await createDbdUser(userDto);
      const expectedTokens = {
        otpToken: 'otp',
        otpBarcode: undefined,
      } as Tokens;
      (service.signin as jest.Mock).mockResolvedValue(expectedTokens);

      const response = await controller.signin(user);

      expect(service.signin).toHaveBeenCalledWith(user);
      expect(response).toEqual(expectedTokens);
    });
  });

  describe('signinOtp', () => {
    it('should be public', () => {
      const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, controller.signinOtp);

      expect(metadata).toEqual(true);
    });

    it('should react to POST signup', () => {
      const method = Reflect.getMetadata(METHOD_METADATA, controller.signinOtp);
      const path = Reflect.getMetadata(PATH_METADATA, controller.signinOtp);

      expect(method).toEqual(RequestMethod.POST);
      expect(path).toEqual('signinOtp');
    });

    it('should use guard JwtOtphAuthGuard', () => {
      const metadata = Reflect.getMetadata(
        GUARDS_METADATA,
        controller.signinOtp,
      );

      expect(metadata).toEqual([JwtOtphAuthGuard]);
    });

    it('should return HttpStatus.OK', () => {
      const metadata = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        controller.signinOtp,
      );

      expect(metadata).toEqual(HttpStatus.OK);
    });

    it('should call auth service with user dto', async () => {
      await controller.signinOtp(otpDto);

      expect(service.confirmOtp).toHaveBeenCalledWith(otpDto, false);
    });

    it('should return token object', async () => {
      const expectedTokens = {
        access_token: 'at',
        refresh_token: 'rt',
      } as Tokens;
      (service.confirmOtp as jest.Mock).mockResolvedValue(expectedTokens);

      const receivedToken = await controller.signinOtp(otpDto);

      expect(receivedToken).toEqual(expectedTokens);
    });
  });

  describe('logout', () => {
    it('should not be public', () => {
      const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, controller.logout);

      expect(metadata).toBeUndefined();
    });

    it('should react to POST logout', () => {
      const method = Reflect.getMetadata(METHOD_METADATA, controller.logout);
      const path = Reflect.getMetadata(PATH_METADATA, controller.logout);

      expect(method).toEqual(RequestMethod.POST);
      expect(path).toEqual('logout');
    });

    it('should return HttpStatus.OK', () => {
      const metadata = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        controller.logout,
      );

      expect(metadata).toEqual(HttpStatus.OK);
    });

    it('should call auth service with userId', async () => {
      await controller.logout('6');

      expect(service.logout).toHaveBeenCalledWith('6');
    });

    it('should return true', async () => {
      (service.logout as jest.Mock).mockResolvedValue(true);

      const receivedResponse = await controller.logout('7');

      expect(receivedResponse).toBeTruthy();
    });
  });

  describe('refreshTokens', () => {
    it('should be public', () => {
      const metadata = Reflect.getMetadata(
        IS_PUBLIC_KEY,
        controller.refreshTokens,
      );

      expect(metadata).toEqual(true);
    });

    it('should react to POST signin', () => {
      const method = Reflect.getMetadata(
        METHOD_METADATA,
        controller.refreshTokens,
      );
      const path = Reflect.getMetadata(PATH_METADATA, controller.refreshTokens);

      expect(method).toEqual(RequestMethod.POST);
      expect(path).toEqual('refresh');
    });

    it('should return HttpStatus.OK', () => {
      const metadata = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        controller.refreshTokens,
      );

      expect(metadata).toEqual(HttpStatus.OK);
    });

    it('should use guard LoggedInAuthGuard', () => {
      const metadata = Reflect.getMetadata(
        GUARDS_METADATA,
        controller.refreshTokens,
      );

      expect(metadata).toEqual([JwtRefreshAuthGuard]);
    });

    it('should call auth service with jwt user', async () => {
      await controller.refreshTokens(jwtUser);

      expect(service.refreshTokens).toHaveBeenCalledWith(
        jwtUser.sub,
        jwtUser.refreshToken,
      );
    });

    it('should return tokens', async () => {
      const expectedTokens = {
        access_token: 'at',
        refresh_token: 'rt',
      } as Tokens;
      (service.refreshTokens as jest.Mock).mockResolvedValue(expectedTokens);

      const receivedToken = await controller.refreshTokens(jwtUser);

      expect(receivedToken).toEqual(expectedTokens);
    });
  });
});

const otpDto = {
  userId: '7',
  otpPassword: '12345',
} as OtpDto;

const jwtUser = {
  sub: '7',
  email: 'testing@super.de',
  refreshToken: 'old refresh token',
} as JwtPayloadWithRefreshToken;
