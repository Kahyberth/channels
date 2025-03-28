import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { envs } from './commons/envs';

async function bootstrap() {
  const logger = new Logger('Channel-ms');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.NATS,
    options: {
      servers: ['nats://localhost:4222'],
    }
  });
  await app.listen().then(() => {
    logger.log('Channel microservice is listening');
  });

  const ws = await NestFactory.create(AppModule);
  ws.enableCors();
  await ws.listen(envs.WS_PORT).then(() => {
    logger.log('Websocket is listening');
  });


}
bootstrap();
