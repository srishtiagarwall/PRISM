import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WebhookModule } from './webhook/webhook.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
        if (redisUrl.startsWith('rediss://')) {
          const url = new URL(redisUrl);
          return {
            redis: {
              host: url.hostname,
              port: Number(url.port) || 6380,
              username: url.username || undefined,
              password: url.password || undefined,
              tls: {},
              maxRetriesPerRequest: null,
            },
          };
        }
        return { redis: redisUrl };
      },
    }),
    WebhookModule,
  ],
})
export class AppModule {}
