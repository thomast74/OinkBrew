import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LoggedInAuthGuard extends AuthGuard('logged-in') {}
