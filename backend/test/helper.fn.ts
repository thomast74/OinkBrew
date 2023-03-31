import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import { AuthDto } from '../src/auth/dtos';
import { ARGON_OPTIONS } from '../src/constants';

export async function createDbdUser(
  user: AuthDto,
  refreshToken = 'rt',
  otpConfirmed = false,
  otpSecret?: string,
) {
  const hash = await argon2.hash(user.password, ARGON_OPTIONS);
  const hashedRt = await argon2.hash(refreshToken, ARGON_OPTIONS);
  otpSecret = otpSecret ?? authenticator.generateSecret();

  return {
    id: '3',
    email: userDto.email,
    hash,
    otpConfirmed,
    otpSecret,
    hashedRt,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export const userDto = {
  email: 'test@user.de',
  password: '12345',
} as AuthDto;

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
