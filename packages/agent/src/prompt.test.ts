import { buildPrompt } from './prompt';
import type { AgentInput } from './types';

const BASE_INPUT: AgentInput = {
  prTitle: 'Fix billing retry logic',
  prAuthor: 'srishti',
  modules: [
    {
      module: 'payments',
      files: ['src/payments/retry.ts'],
      owners: ['Alice', 'Bob'],
      isNewModule: false,
    },
  ],
  dependencies: [
    {
      module: 'payments',
      imports: ['queue'],
      importedBy: ['notifications'],
    },
  ],
};

describe('buildPrompt', () => {
  it('includes PR title and author', () => {
    const prompt = buildPrompt(BASE_INPUT);
    expect(prompt).toContain('Fix billing retry logic');
    expect(prompt).toContain('srishti');
  });

  it('lists module owners', () => {
    const prompt = buildPrompt(BASE_INPUT);
    expect(prompt).toContain('Alice, Bob');
  });

  it('includes blast radius', () => {
    const prompt = buildPrompt(BASE_INPUT);
    expect(prompt).toContain('notifications');
  });

  it('shows new module sentinel when isNewModule=true', () => {
    const input: AgentInput = {
      ...BASE_INPUT,
      modules: [
        {
          module: 'brand-new',
          files: ['src/brand-new/feature.ts'],
          owners: [],
          isNewModule: true,
        },
      ],
      dependencies: [],
    };
    const prompt = buildPrompt(input);
    expect(prompt).toContain('new module — no ownership data');
  });

  it('instructs model to output only the card', () => {
    const prompt = buildPrompt(BASE_INPUT);
    expect(prompt).toContain('no preamble, no explanation, just the card');
    expect(prompt).toContain('🔍 PRISM — Codebase Context Card');
  });

  it('handles a module with no dependencies', () => {
    const input: AgentInput = {
      ...BASE_INPUT,
      dependencies: [],
    };
    const prompt = buildPrompt(input);
    expect(prompt).toContain('Imports: none');
    expect(prompt).toContain('Imported by: none');
  });
});
