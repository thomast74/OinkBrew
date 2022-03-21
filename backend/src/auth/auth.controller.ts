import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { User } from '../users/types';
import { AuthService } from './auth.service';
import { GetRequestUser, GetRequestUserId, Public } from './decorators';
import { AuthDto } from './dtos';
import { JwtRefreshAuthGuard, LoggedInAuthGuard } from './guards';
import { JwtPayloadWithRefreshToken, Tokens } from './types';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // TODO: Check if user has TOTP verified; yes: send response to request TOTP with totp token; no: return error to setup TOTP
  // TODO: Verify TOTP, if valid mark user as verified and return access token, if not return 400 error
  // TODO: Check TOTP, if valid return access token, if not return 400 error

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: AuthDto) {
    return this.authService.signup(dto);
  }

  @Public()
  @Post('signin')
  @UseGuards(LoggedInAuthGuard)
  @HttpCode(HttpStatus.OK)
  async signin(@GetRequestUser() user: User) {
    return this.authService.signin(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@GetRequestUserId() userId: number): Promise<boolean> {
    return this.authService.logout(userId);
  }

  @Public()
  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetRequestUser() user: JwtPayloadWithRefreshToken,
  ): Promise<Tokens> {
    return this.authService.refreshTokens(user.sub, user.refreshToken);
  }
}
