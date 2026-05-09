import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'path';
// Walk up from cwd until we find .env — works regardless of where ts-node is invoked from
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '../..', '.env') });
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`PRISM webhook listening on port ${port}`);
}

bootstrap();
