import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AnalysisProcessor } from './analysis.processor';

export const PR_ANALYSIS_QUEUE = 'pr-analysis';

@Module({
  imports: [
    BullModule.registerQueue({ name: PR_ANALYSIS_QUEUE }),
  ],
  providers: [AnalysisProcessor],
})
export class AnalysisModule {}
