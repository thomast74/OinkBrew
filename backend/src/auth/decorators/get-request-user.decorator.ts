import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetRequestUser = createParamDecorator(
  (_: undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);
