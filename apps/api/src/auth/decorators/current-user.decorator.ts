import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  userId: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: CurrentUserData }>();
    const user = request.user;
    if (!user) return null;
    if (data === 'id' || data === 'userId') {
      return user.userId;
    }
    return data ? (user as any)[data] : user;
  },
);
