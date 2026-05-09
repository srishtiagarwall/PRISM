import { Module } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bull';
import { WebhookController } from './webhook.controller';

export const PR_ANALYSIS_QUEUE = 'pr-analysis';

@Module({
  imports: [
    BullModule.registerQueue({ name: PR_ANALYSIS_QUEUE }),
  ],
  controllers: [WebhookController],
  providers: [
    {
      provide: 'ANALYSIS_QUEUE',
      useFactory: (queue: unknown) => queue,
      inject: [getQueueToken(PR_ANALYSIS_QUEUE)],
    },
  ],
})
export class WebhookModule {}
