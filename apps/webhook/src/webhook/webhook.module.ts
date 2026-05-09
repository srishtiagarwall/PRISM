import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WebhookController } from './webhook.controller';

export const PR_ANALYSIS_QUEUE = 'pr-analysis';

@Module({
  imports: [
    BullModule.registerQueue({ name: PR_ANALYSIS_QUEUE }),
  ],
  controllers: [WebhookController],
})
export class WebhookModule {}
