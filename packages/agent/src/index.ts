import Anthropic from '@anthropic-ai/sdk';
import { buildPrompt } from './prompt';
import type { AgentInput } from './types';

export type { AgentInput } from './types';

const MODEL = 'claude-sonnet-4-6';

/**
 * Single LangGraph-style node: takes parsed PR context, returns a markdown
 * context card string. Calls Claude once with a structured prompt — no
 * multi-step flow needed for Phase 1.
 */
export async function generateContextCard(input: AgentInput): Promise<string> {
  const client = new Anthropic();
  const prompt = buildPrompt(input);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Agent returned no text content');
  }

  return textBlock.text.trim();
}
