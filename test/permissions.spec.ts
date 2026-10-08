import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '../src/common/auth/authenticated-request.interface';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';

describe('PermissionsGuard', () => {
  it('rejects a user missing a required permission', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(['merchant.approve']) };
    const guard = new PermissionsGuard(reflector as unknown as Reflector);
    const request = { user: { permissions: [] } } as unknown as AuthenticatedRequest;
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: (): { getRequest: () => AuthenticatedRequest } => ({
        getRequest: (): AuthenticatedRequest => request,
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
