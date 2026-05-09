import Anthropic from '@anthropic-ai/sdk';
import { generateContextCard } from './index';
import type { AgentInput } from './types';

const CARD_TEXT =
  '## 🔍 PRISM — Codebase Context Card\n\n**Modules Touched:** payments\n**Owners:** @Alice (payments)\n**Blast Radius:** notifications\n\n**What This PR Changes:**\nThis PR modifies billing retry logic.\n\n**Risk Signal:** No elevated risk signals.';

const mockCreate = jest.fn().mockResolvedValue({
  content: [{ type: 'text', text: CARD_TEXT }],
  stop_reason: 'end_turn',
  usage: { input_tokens: 100, output_tokens: 80 },
});

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

const INPUT: AgentInput = {
  prTitle: 'Fix billing retry logic',
  prAuthor: 'srishti',
  modules: [
    {
      module: 'payments',
      files: ['src/payments/retry.ts'],
      owners: ['Alice'],
      isNewModule: false,
    },
  ],
  dependencies: [
    {
      module: 'payments',
      imports: [],
      importedBy: ['notifications'],
    },
  ],
};

describe('generateContextCard', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns a markdown context card string', async () => {
    const card = await generateContextCard(INPUT);
    expect(card).toContain('🔍 PRISM — Codebase Context Card');
    expect(card).toContain('payments');
  });

  it('calls the Anthropic API exactly once', async () => {
    await generateContextCard(INPUT);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('throws when the API returns no text block', async () => {
    mockCreate.mockResolvedValueOnce({ content: [] });
    await expect(generateContextCard(INPUT)).rejects.toThrow(
      'Agent returned no text content',
    );
  });
});
