import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { randomUUID } from 'crypto';

interface SuccessResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  traceId: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<SuccessResponse<T>> {
    const traceId = randomUUID();
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
        traceId,
      })),
    );
  }
}
