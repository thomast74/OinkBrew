import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import jwtConfig from '../config/jwt.config';
import { JwtPayload } from '../types';

@Injectable()
export class JwtOtpStrategy extends PassportStrategy(Strategy, 'jwt-otp') {
  constructor(
    @Inject(jwtConfig.KEY)
    jwt: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKey: jwt.otpTokenSecret,
    });
  }

  validate(payload: JwtPayload) {
    return { sub: payload.sub, email: payload.email };
  }
}
