import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import Bull, { Queue } from 'bull';
import { getInstallationToken, fetchPRFiles, postPRComment } from '@prism/github-client';
import { parseChangedFiles } from '@prism/git-parser';
import { buildDependencyMap } from '@prism/dep-mapper';
import { generateContextCard } from '@prism/agent';
import type { FileContentMap } from '@prism/dep-mapper';

interface PRJob {
  owner: string;
  repo: string;
  prNumber: number;
  prTitle: string;
  prAuthor: string;
  installationId: string;
}

@Injectable()
export class AnalysisProcessor implements OnModuleInit {
  private readonly logger = new Logger(AnalysisProcessor.name);
  private queue!: Queue<PRJob>;

  constructor(@Inject('ANALYSIS_QUEUE_NAME') private readonly queueName: string) {}

  onModuleInit() {
    this.queue = new Bull<PRJob>(this.queueName, {
      redis: process.env.REDIS_URL ?? 'redis://localhost:6379',
    });

    this.queue.process('analyse-pr', async (job) => {
      await this.handleAnalysePR(job.data);
    });

    this.logger.log(`Listening on queue: ${this.queueName}`);
  }

  private async handleAnalysePR(data: PRJob): Promise<void> {
    const { owner, repo, prNumber, prTitle, prAuthor, installationId } = data;
    this.logger.log(`Processing PR #${prNumber} for ${owner}/${repo}`);

    try {
      const token = await getInstallationToken(
        process.env.GITHUB_APP_ID!,
        process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        installationId,
      );

      const prFiles = await fetchPRFiles(token, owner, repo, prNumber);
      const changedPaths = prFiles.map((f) => f.filename);

      const fileContentMap: FileContentMap = new Map();
      for (const f of prFiles) {
        if (f.patch) {
          const addedLines = f.patch
            .split('\n')
            .filter((line: string) => line.startsWith('+') && !line.startsWith('+++'))
            .map((line: string) => line.slice(1))
            .join('\n');
          fileContentMap.set(f.filename, addedLines);
        }
      }

      const repoRoot = process.env.REPO_ROOT ?? process.cwd();
      const modules = parseChangedFiles(changedPaths, repoRoot);
      const dependencies = buildDependencyMap(fileContentMap);

      const contextCard = await generateContextCard({
        modules,
        dependencies,
        prTitle,
        prAuthor,
      });

      await postPRComment(token, owner, repo, prNumber, contextCard);
      this.logger.log(`Posted context card on PR #${prNumber}`);
    } catch (err) {
      this.logger.error(
        `Failed to process PR #${prNumber} for ${owner}/${repo}: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }
}
