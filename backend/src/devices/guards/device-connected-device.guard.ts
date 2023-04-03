import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

import { Observable } from 'rxjs';

@Injectable()
export class DeviceConnectedDeviceGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    if (!request.body.name) {
      throw new BadRequestException(
        'Connected Device Name must not be null or empty',
      );
    }

    if (
      !Object.keys(request.body).some((key) => key === 'offset') ||
      isNaN(request.body.offset)
    ) {
      throw new BadRequestException(
        'Connected Device Offset must be provided or 0',
      );
    }

    return true;
  }
}
