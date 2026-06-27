import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(OptionalJwtAuthGuard.name);

  handleRequest<TUser = { userId: string } | null>(
    err: unknown,
    user: TUser,
    info: unknown,
  ): TUser | null {
    if (err || !user) {
      const reason = err ? String(err) : (info ? String(info) : 'no token');
      this.logger.debug(`JWT parse error (optional guard, treating as anonymous): ${reason}`);
      return null;
    }
    return user;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as boolean | Promise<boolean>;
  }
}
