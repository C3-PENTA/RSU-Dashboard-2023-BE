import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AuthAdapter } from './modules/auth/service/auth.adapter';
import { CORS } from './constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(CORS);

  app.use(cookieParser());
  // app.useWebSocketAdapter(new AuthAdapter(app));

  app.setGlobalPrefix('api');
  const options = new DocumentBuilder()
    .setTitle('Penta Security')
    .setDescription('Penta Security Swagger API Document')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api/docs', app, document);

  await app.startAllMicroservices();
  await app.listen(process.env.APP_PORT);
}
bootstrap();
