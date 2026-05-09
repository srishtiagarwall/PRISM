import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WebhookModule } from './webhook/webhook.module';

@Module({
  imports: [
    BullModule.forRoot({
      redis: process.env.REDIS_URL ?? 'redis://localhost:6379',
    }),
    WebhookModule,
  ],
})
export class AppModule {}
