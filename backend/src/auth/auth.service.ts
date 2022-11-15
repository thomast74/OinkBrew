import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { ARGON_OPTIONS } from '../constants';
import { User } from '../users/types/user.type';
import { UsersService } from '../users/users.service';
import jwtConfig from './config/jwt.config';
import { AuthDto, OtpDto } from './dtos';
import { JwtPayload, Tokens } from './types';

const OTP_SERVICE_NAME = 'OinkBrew';
@Injectable()
export class AuthService {
  constructor(
    @Inject(jwtConfig.KEY)
    private jwt: ConfigType<typeof jwtConfig>,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      Logger.log('user not found');
      return null;
    }

    const passwordMatches = await argon2.verify(
      user.hash,
      password,
      ARGON_OPTIONS,
    );

    Logger.log(`passwordMatches: ${passwordMatches}`);

    if (passwordMatches) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { hash, hashedRt, ...result } = user;
      return result;
    }

    return null;
  }

  async signup(dto: AuthDto): Promise<Tokens> {
    const user = await this.usersService.create(dto);

    if (!user || !user.id || !user.email || !user.otpSecret) {
      throw new BadRequestException('User was not created');
    }

    return await this.getOtpTokenAndBarcode(user);
  }

  async confirmOtp(dto: OtpDto, confirmOtp = false): Promise<Tokens> {
    const user = await this.usersService.findById(dto.userId);
    const otpConfirmedNotCorrect = confirmOtp
      ? user?.otpConfirmed ?? true
      : !user?.otpConfirmed ?? true;

    if (!user || !user.otpSecret || otpConfirmedNotCorrect) {
      throw new BadRequestException('User not valid');
    }

    const otpValid = authenticator.check(dto.otpPassword, user.otpSecret);

    if (!otpValid) {
      throw new ForbiddenException('Access Denied');
    }

    return await this.getAccessTokensAndUpdateUser(
      user.id,
      user.email,
      confirmOtp,
    );
  }

  async signin(user: User): Promise<Tokens> {
    if (
      !user ||
      !user.id ||
      !user.email ||
      !user.otpSecret ||
      !user.otpConfirmed
    ) {
      throw new BadRequestException('User not signed up correctly');
    }

    Logger.log('get otp token');

    return await this.getOtpToken(user.id, user.email);
  }

  async logout(userId: number): Promise<boolean> {
    await this.usersService.updateRefreshToken(userId);
    return true;
  }

  async refreshTokens(userId: number, refreshToken: string): Promise<Tokens> {
    const user = await this.usersService.findById(userId);

    if (!user || !user.hashedRt) throw new ForbiddenException('Access Denied');

    let rtMatches = false;
    try {
      rtMatches = await argon2.verify(
        user.hashedRt,
        refreshToken,
        ARGON_OPTIONS,
      );
    } catch {}

    if (!rtMatches) throw new ForbiddenException('Access Denied');

    return await this.getAccessTokensAndUpdateUser(user.id, user.email);
  }

  private async getOtpTokenAndBarcode(user: User): Promise<Tokens> {
    const tokens = await this.getOtpToken(user.id, user.email);

    tokens.otpUrl = this.getOtpUrl(user.email, user.otpSecret);
    tokens.otpBarcode = await this.getOtpBarcode(tokens.otpUrl);

    return tokens;
  }

  private async getOtpToken(userId: number, email: string): Promise<Tokens> {
    const jwtPayload: JwtPayload = {
      sub: userId,
      email: email,
    };

    const otp = await this.jwtService.signAsync(jwtPayload, {
      secret: this.jwt.otpTokenSecret,
      expiresIn: `${this.jwt.otpTokenExpiration}m`,
    });

    return {
      otpToken: otp,
      userId,
    };
  }

  private getOtpUrl(email: string, otpSecret: string): string {
    return authenticator.keyuri(email, OTP_SERVICE_NAME, otpSecret);
  }

  private async getOtpBarcode(otpUrl: string): Promise<any> {
    return await qrcode.toDataURL(otpUrl);
  }

  private async getAccessTokensAndUpdateUser(
    userId: number,
    email: string,
    confirmOtp?: boolean,
  ): Promise<Tokens> {
    const tokens = await this.getAccessTokens(userId, email);
    await this.usersService.updateRefreshToken(
      userId,
      tokens.refreshToken,
      confirmOtp,
    );

    return tokens;
  }

  private async getAccessTokens(
    userId: number,
    email: string,
  ): Promise<Tokens> {
    const jwtPayload: JwtPayload = {
      sub: userId,
      email: email,
    };

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.jwt.accessTokenSecret,
        expiresIn: `${this.jwt.accessTokenExpiration}m`,
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.jwt.refreshTokenSecret,
        expiresIn: `${this.jwt.refreshTokenExpiration}d`,
      }),
    ]);

    return {
      accessToken: at,
      refreshToken: rt,
    };
  }
}
