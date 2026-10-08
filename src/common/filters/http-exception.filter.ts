import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorResponse {
  error: {
    code: string;
    message: string | string[];
    correlationId?: string;
  };
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionBody = exception instanceof HttpException ? exception.getResponse() : undefined;
    const message = this.getMessage(exceptionBody, status);
    const code = this.getCode(exceptionBody, status);
    const correlationId = response.getHeader('x-correlation-id')?.toString();

    const body: ErrorResponse = {
      error: { code, message, correlationId },
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    };

    response.status(status).json(body);
  }

  private getMessage(body: string | object | undefined, status: number): string | string[] {
    if (typeof body === 'string') return body;
    if (body && 'message' in body) {
      const message = body.message;
      if (
        typeof message === 'string' ||
        (Array.isArray(message) && message.every((item) => typeof item === 'string'))
      ) {
        return message;
      }
    }
    return status === 500 ? 'Internal server error' : 'Request failed';
  }

  private getCode(body: string | object | undefined, status: number): string {
    if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
      return body.error.toUpperCase().replaceAll(' ', '_');
    }
    return `HTTP_${status}`;
  }
}
