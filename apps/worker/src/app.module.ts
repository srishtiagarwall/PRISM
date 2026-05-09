import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AnalysisModule } from './analysis/analysis.module';

@Module({
  imports: [
    BullModule.forRoot({
      redis: process.env.REDIS_URL ?? 'redis://localhost:6379',
    }),
    AnalysisModule,
  ],
})
export class AppModule {}
