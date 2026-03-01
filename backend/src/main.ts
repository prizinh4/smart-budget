import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // API versioning prefix (exclude health endpoints)
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'health/liveness', 'health/readiness'],
  });

  app.enableCors({
    origin: '*', // só use '*' para desenvolvimento!
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('SmartBudget API')
    .setDescription('API for personal finance management with real-time insights')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('health', 'Health check endpoints')
    .addTag('auth', 'Authentication endpoints')
    .addTag('transactions', 'Transaction management')
    .addTag('categories', 'Category management')
    .addTag('goals', 'Financial goals')
    .addTag('dashboard', 'Dashboard and insights')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`Backend running on http://0.0.0.0:${process.env.PORT ?? 3000}`);
  console.log(`Swagger docs at http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}
bootstrap();