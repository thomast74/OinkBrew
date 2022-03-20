import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAccessAuthGuard } from './auth/jwt-access-auth.guard';

@Controller()
export class AppController {
  @UseGuards(JwtAccessAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
