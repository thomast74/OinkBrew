import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LogInAuthGuard extends AuthGuard('log-in') {}
