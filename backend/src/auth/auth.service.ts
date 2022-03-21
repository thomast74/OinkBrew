import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Argon2Options } from '../constants';
import { User } from '../users/types/user.type';
import { UsersService } from '../users/users.service';
import jwtConfig from './config/jwt.config';
import { AuthDto } from './dtos';
import { JwtPayload, Tokens } from './types';

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

    const passwordMatches = await argon2.verify(
      user.hash,
      password,
      Argon2Options,
    );

    if (user && passwordMatches) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { hash, hashedRt, ...result } = user;
      return result;
    }

    return null;
  }

  async signup(dto: AuthDto): Promise<Tokens> {
    const user = await this.usersService.create(dto);

    const tokens = await this.getTokens(user.id, user.email);
    await this.usersService.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  async signin(user: User): Promise<Tokens> {
    const tokens = await this.getTokens(user.id, user.email);
    await this.usersService.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  async logout(userId: number): Promise<boolean> {
    await this.usersService.updateRefreshToken(userId, null);
    return true;
  }

  async refreshTokens(userId: number, refreshToken: string): Promise<Tokens> {
    const user = await this.usersService.findById(userId);

    if (!user || !user.hashedRt) throw new ForbiddenException('Access Denied');

    const rtMatches = await argon2.verify(
      user.hashedRt,
      refreshToken,
      Argon2Options,
    );
    if (!rtMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.email);
    await this.usersService.updateRefreshToken(userId, tokens.refresh_token);

    return tokens;
  }

  async getTokens(userId: number, email: string): Promise<Tokens> {
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
        expiresIn: `${this.jwt.accessTokenExpiration}d`,
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }
}
