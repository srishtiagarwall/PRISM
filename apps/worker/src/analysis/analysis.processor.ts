import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { getInstallationToken, fetchPRFiles, postPRComment } from '@prism/github-client';
import { parseChangedFiles } from '@prism/git-parser';
import { buildDependencyMap } from '@prism/dep-mapper';
import { generateContextCard } from '@prism/agent';
import { PR_ANALYSIS_QUEUE } from './analysis.module';

interface PRJob {
  owner: string;
  repo: string;
  prNumber: number;
  prTitle: string;
  prAuthor: string;
  installationId: string;
}

@Processor(PR_ANALYSIS_QUEUE)
export class AnalysisProcessor {
  private readonly logger = new Logger(AnalysisProcessor.name);

  @Process('analyse-pr')
  async handleAnalysePR(job: Job<PRJob>): Promise<void> {
    const { owner, repo, prNumber, prTitle, prAuthor, installationId } = job.data;
    this.logger.log(`Processing PR #${prNumber} for ${owner}/${repo}`);

    try {
      // 1. Auth
      const token = await getInstallationToken(
        process.env.GITHUB_APP_ID!,
        process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        installationId,
      );

      // 2. Fetch changed files
      const prFiles = await fetchPRFiles(token, owner, repo, prNumber);
      const changedPaths = prFiles.map((f) => f.filename);

      // 3. Build FileContentMap from patch content for dep-mapper
      const fileContentMap = new Map<string, string>();
      for (const f of prFiles) {
        if (f.patch) {
          // Extract only added lines from the unified diff for import analysis
          const addedLines = f.patch
            .split('\n')
            .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
            .map((line) => line.slice(1))
            .join('\n');
          fileContentMap.set(f.filename, addedLines);
        }
      }

      // 4. Parse modules + ownership (needs repo root for git log)
      const repoRoot = process.env.REPO_ROOT ?? process.cwd();
      const modules = parseChangedFiles(changedPaths, repoRoot);

      // 5. Build dependency map
      const dependencies = buildDependencyMap(fileContentMap);

      // 6. Generate context card via LLM
      const contextCard = await generateContextCard({
        modules,
        dependencies,
        prTitle,
        prAuthor,
      });

      // 7. Post comment
      await postPRComment(token, owner, repo, prNumber, contextCard);
      this.logger.log(`Posted context card on PR #${prNumber}`);
    } catch (err) {
      // Log and swallow — never post a broken comment
      this.logger.error(
        `Failed to process PR #${prNumber} for ${owner}/${repo}: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }
}
