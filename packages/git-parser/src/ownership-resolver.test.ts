import { execSync } from 'child_process';
import { getFileOwners, resolveModuleOwners } from './ownership-resolver';

jest.mock('child_process');
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('getFileOwners', () => {
  afterEach(() => jest.resetAllMocks());

  it('returns top 2 contributors sorted by commit count', () => {
    mockExecSync.mockReturnValue('Alice\nBob\nAlice\nAlice\nBob\nCarol\n' as any);
    const result = getFileOwners('src/payments/retry.ts', '/repo');
    expect(result.owners).toEqual(['Alice', 'Bob']);
    expect(result.hasNoHistory).toBe(false);
  });

  it('returns fewer than topN when not enough contributors', () => {
    mockExecSync.mockReturnValue('Alice\nAlice\n' as any);
    const result = getFileOwners('src/payments/retry.ts', '/repo');
    expect(result.owners).toEqual(['Alice']);
    expect(result.hasNoHistory).toBe(false);
  });

  it('sets hasNoHistory=true when git succeeds but file has zero commits (new file)', () => {
    mockExecSync.mockReturnValue('' as any);
    const result = getFileOwners('src/brand-new.ts', '/repo');
    expect(result.owners).toEqual([]);
    expect(result.hasNoHistory).toBe(true);
  });

  it('sets hasNoHistory=false when git itself throws (not a repo, binary, etc.)', () => {
    mockExecSync.mockImplementation(() => { throw new Error('not a git repo'); });
    const result = getFileOwners('src/payments/retry.ts', '/repo');
    expect(result.owners).toEqual([]);
    expect(result.hasNoHistory).toBe(false);
  });
});

describe('resolveModuleOwners', () => {
  afterEach(() => jest.resetAllMocks());

  it('aggregates owners across multiple files and picks top 2', () => {
    mockExecSync
      .mockReturnValueOnce('Alice\nBob\n' as any)
      .mockReturnValueOnce('Alice\nCarol\n' as any);

    const result = resolveModuleOwners(
      ['src/payments/retry.ts', 'src/payments/queue.ts'],
      '/repo',
    );
    expect(result.owners[0]).toBe('Alice');
    expect(result.owners).toHaveLength(2);
    expect(result.isNewModule).toBe(false);
  });

  it('sets isNewModule=true only when ALL files have no history', () => {
    mockExecSync
      .mockReturnValueOnce('' as any)
      .mockReturnValueOnce('' as any);

    const result = resolveModuleOwners(
      ['src/feature/new-a.ts', 'src/feature/new-b.ts'],
      '/repo',
    );
    expect(result.owners).toEqual([]);
    expect(result.isNewModule).toBe(true);
  });

  it('sets isNewModule=false when at least one file has history', () => {
    mockExecSync
      .mockReturnValueOnce('' as any)          // new file — no history
      .mockReturnValueOnce('Alice\n' as any);  // existing file

    const result = resolveModuleOwners(
      ['src/feature/new.ts', 'src/feature/old.ts'],
      '/repo',
    );
    expect(result.isNewModule).toBe(false);
    expect(result.owners).toEqual(['Alice']);
  });
});
