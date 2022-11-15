import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LogInStrategy extends PassportStrategy(Strategy, 'log-in') {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    Logger.log(`validate => ${password}`);
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new ForbiddenException('Access Denied');
    }

    Logger.log('user ok');
    return user;
  }
}
