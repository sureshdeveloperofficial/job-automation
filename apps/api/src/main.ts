import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Logger
  app.useLogger(app.get(Logger));

  // Security
  app.use(helmet());

  // CORS — restrict in production
  app.enableCors({
    origin: process.env['WEB_URL'] ?? 'http://localhost:1962',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global guards
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptors
  app.useGlobalInterceptors(new ResponseInterceptor());

  // OpenAPI / Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI Career OS API')
    .setDescription('The complete AI Career OS REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = parseInt(process.env['API_PORT'] ?? process.env['PORT'] ?? '1961', 10);
  const host = process.env['API_HOST'] ?? '0.0.0.0';
  await app.listen(port, host);

  console.log(`🚀 API running at http://localhost:${port}/api/v1`);
  console.log(`📖 Swagger docs at http://localhost:${port}/api/docs`);
}

await bootstrap();
