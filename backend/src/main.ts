import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // só use '*' para desenvolvimento!
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`Backend running on http://0.0.0.0:${process.env.PORT ?? 3000}`);
}
bootstrap();