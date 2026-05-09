import { resolveImportToModule, fileToModule } from './module-resolver';

describe('resolveImportToModule', () => {
  it('resolves a sibling directory import', () => {
    expect(
      resolveImportToModule('src/payments/retry.ts', '../notifications/email'),
    ).toBe('notifications');
  });

  it('resolves a same-module relative import to the same module', () => {
    expect(
      resolveImportToModule('src/payments/retry.ts', './queue'),
    ).toBe('payments');
  });

  it('resolves without src/ prefix', () => {
    expect(
      resolveImportToModule('payments/retry.ts', '../auth/login'),
    ).toBe('auth');
  });

  it('returns null when import escapes above the repo root', () => {
    expect(
      resolveImportToModule('src/payments/retry.ts', '../../../outside'),
    ).toBeNull();
  });
});

describe('fileToModule', () => {
  it('strips src/ and returns first subdirectory', () => {
    expect(fileToModule('src/payments/retry.ts')).toBe('payments');
  });

  it('returns root for top-level files', () => {
    expect(fileToModule('package.json')).toBe('root');
  });

  it('handles apps/ prefix', () => {
    expect(fileToModule('apps/webhook/src/main.ts')).toBe('webhook');
  });
});
