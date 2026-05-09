import { Module } from '@nestjs/common';
import { AnalysisProcessor } from './analysis.processor';

export const PR_ANALYSIS_QUEUE = 'pr-analysis';

@Module({
  providers: [
    {
      provide: 'ANALYSIS_QUEUE_NAME',
      useValue: PR_ANALYSIS_QUEUE,
    },
    AnalysisProcessor,
  ],
})
export class AnalysisModule {}
