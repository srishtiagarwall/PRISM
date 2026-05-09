import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '../..', '.env') });
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.init();
  console.log('PRISM worker started — consuming pr-analysis queue');
}

bootstrap();
