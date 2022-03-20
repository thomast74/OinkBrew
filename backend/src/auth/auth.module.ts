import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { LoggedInStrategy } from './logged-in.strategy';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { JwtAccessStrategy } from './jwt-access.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.access_token_secret,
      signOptions: { expiresIn: `${jwtConstants.access_token_expiration}s` },
    }),
  ],
  providers: [AuthService, LoggedInStrategy, JwtAccessStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
