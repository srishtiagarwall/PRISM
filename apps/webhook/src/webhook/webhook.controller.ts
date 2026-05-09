import {
  Controller,
  Post,
  Headers,
  Body,
  HttpCode,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { Queue } from 'bull';
import { createHmac, timingSafeEqual } from 'crypto';

interface GitHubPRPayload {
  action: string;
  number: number;
  pull_request: {
    title: string;
    user: { login: string };
    head: { sha: string };
  };
  repository: {
    name: string;
    owner: { login: string };
  };
  installation?: { id: number };
}

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    @Inject('ANALYSIS_QUEUE') private readonly queue: Queue,
  ) {}

  @Post('github')
  @HttpCode(200)
  async handleGitHubWebhook(
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Headers('x-github-event') event: string | undefined,
    @Body() body: unknown,
  ) {
    const rawBody = JSON.stringify(body);
    this.verifySignature(rawBody, signature);

    if (event !== 'pull_request') {
      return { status: 'ignored', reason: `event=${event}` };
    }

    const payload = body as GitHubPRPayload;
    if (!['opened', 'synchronize'].includes(payload.action)) {
      return { status: 'ignored', reason: `action=${payload.action}` };
    }

    const job = {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      prNumber: payload.number,
      prTitle: payload.pull_request.title,
      prAuthor: payload.pull_request.user.login,
      installationId: String(payload.installation?.id ?? process.env.GITHUB_INSTALLATION_ID ?? ''),
    };

    await this.queue.add('analyse-pr', job);
    this.logger.log(`Queued PR #${job.prNumber} from ${job.owner}/${job.repo}`);

    return { status: 'queued' };
  }

  private verifySignature(body: string, signature: string | undefined): void {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.warn('GITHUB_WEBHOOK_SECRET not set — skipping signature verification');
      return;
    }

    if (!signature) {
      throw new BadRequestException('Missing x-hub-signature-256 header');
    }

    const expected = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      throw new BadRequestException('Invalid webhook signature');
    }
  }
}
