import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from './roles.guard';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: RequestUser }>();
    return request.user;
  },
);
