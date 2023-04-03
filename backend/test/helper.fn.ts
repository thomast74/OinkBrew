/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-empty-function */
import { LoggerService, LogLevel } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export class TestingLogger implements LoggerService {
  log(_message: any, ..._optionalParams: any[]) {}
  error(_message: any, ..._optionalParams: any[]) {}
  warn(_message: any, ..._optionalParams: any[]) {}
  debug?(_message: any, ..._optionalParams: any[]) {}
  verbose?(_message: any, ..._optionalParams: any[]) {}
  setLogLevels?(_levels: LogLevel[]) {}
}

export async function createOtpToken(
  jwt: JwtService,
  id?: string,
  email?: string,
): Promise<string> {
  const jwtPayload = {
    sub: id,
    email: email,
  };

  const otpToken = await jwt.signAsync(jwtPayload, {
    secret: process.env.JWT_OTP_TOKEN_SECRET,
    expiresIn: `${process.env.JWT_OTP_TOKEN_EXPIRATION_TIME}m`,
  });

  return otpToken;
}

export async function createAccessToken(
  jwt: JwtService,
  id?: string,
  email?: string,
): Promise<string> {
  const jwtPayload = {
    sub: id,
    email: email,
  };

  const accessToken = await jwt.signAsync(jwtPayload, {
    secret: process.env.JWT_ACCESS_TOKEN_SECRET,
    expiresIn: `${process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME}m`,
  });

  return accessToken;
}

export async function createRefreshToken(
  jwt: JwtService,
  id?: string,
  email?: string,
): Promise<string> {
  const jwtPayload = {
    sub: id,
    email: email,
  };

  const refreshToken = await jwt.signAsync(jwtPayload, {
    secret: process.env.JWT_REFRESH_TOKEN_SECRET,
    expiresIn: `${process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME}m`,
  });

  return refreshToken;
}

export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
