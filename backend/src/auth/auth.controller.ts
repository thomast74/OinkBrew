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
import { AuthDto, OtpDto } from './dtos';
import {
  JwtOtphAuthGuard as JwtOtpAuthGuard,
  JwtRefreshAuthGuard,
  LogInAuthGuard,
} from './guards';
import { JwtPayloadWithRefreshToken, Tokens } from './types';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.OK)
  async signup(@Body() dto: AuthDto) {
    return this.authService.signup(dto);
  }

  @Public()
  @Post('signupOtp')
  @UseGuards(JwtOtpAuthGuard)
  @HttpCode(HttpStatus.OK)
  async signupOtp(@Body() dto: OtpDto) {
    return this.authService.confirmOtp(dto, true);
  }

  @Public()
  @Post('signin')
  @UseGuards(LogInAuthGuard)
  @HttpCode(HttpStatus.OK)
  async signin(@GetRequestUser() user: User) {
    return await this.authService.signin(user);
  }

  @Public()
  @Post('signinOtp')
  @UseGuards(JwtOtpAuthGuard)
  @HttpCode(HttpStatus.OK)
  async signinOtp(@Body() dto: OtpDto) {
    return this.authService.confirmOtp(dto, false);
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
