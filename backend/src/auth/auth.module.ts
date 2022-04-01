import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import jwtConfig from './config/jwt.config';
import {
  JwtAccessStrategy,
  JwtOtpStrategy,
  JwtRefreshStrategy,
  LoggedInStrategy,
} from './strategies';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig],
    }),
    UsersModule,
    PassportModule,
    JwtModule.register({}),
  ],
  providers: [
    AuthService,
    LoggedInStrategy,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    JwtOtpStrategy,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
