import { execSync } from 'child_process';
import { getFileOwners, resolveModuleOwners } from './ownership-resolver';

jest.mock('child_process');
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('getFileOwners', () => {
  afterEach(() => jest.resetAllMocks());

  it('returns top 2 contributors sorted by commit count', () => {
    mockExecSync.mockReturnValue(
      'Alice\nBob\nAlice\nAlice\nBob\nCarol\n' as any,
    );
    const owners = getFileOwners('src/payments/retry.ts', '/repo');
    expect(owners).toEqual(['Alice', 'Bob']);
  });

  it('returns fewer than topN when not enough contributors', () => {
    mockExecSync.mockReturnValue('Alice\nAlice\n' as any);
    const owners = getFileOwners('src/payments/retry.ts', '/repo');
    expect(owners).toEqual(['Alice']);
  });

  it('returns empty array when git throws', () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('not a git repo');
    });
    const owners = getFileOwners('src/payments/retry.ts', '/repo');
    expect(owners).toEqual([]);
  });

  it('returns empty array for file with no commits', () => {
    mockExecSync.mockReturnValue('' as any);
    const owners = getFileOwners('src/new-file.ts', '/repo');
    expect(owners).toEqual([]);
  });
});

describe('resolveModuleOwners', () => {
  afterEach(() => jest.resetAllMocks());

  it('aggregates owners across multiple files', () => {
    mockExecSync
      .mockReturnValueOnce('Alice\nBob\n' as any)
      .mockReturnValueOnce('Alice\nCarol\n' as any);

    const owners = resolveModuleOwners(
      ['src/payments/retry.ts', 'src/payments/queue.ts'],
      '/repo',
    );
    // Alice appears in both files (count=2), Bob and Carol once each
    expect(owners[0]).toBe('Alice');
    expect(owners).toHaveLength(2);
  });
});
