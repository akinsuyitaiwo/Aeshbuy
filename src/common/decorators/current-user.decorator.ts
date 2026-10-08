import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.interface';
import type { AuthenticatedRequest } from '../auth/authenticated-request.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
