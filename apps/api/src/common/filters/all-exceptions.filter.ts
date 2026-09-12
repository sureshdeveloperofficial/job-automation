import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';

interface HttpExceptionBody {
  message?: string | string[];
  errors?: string[];
  statusCode?: number;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId = randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as HttpExceptionBody | string;
      if (typeof body === 'string') {
        message = body;
      } else {
        message = typeof body.message === 'string' ? body.message : (body.message?.[0] ?? message);
        errors = body.errors;
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
        { traceId },
      );
    }

    response.status(status).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
      traceId,
      path: request.url,
    });
  }
}
