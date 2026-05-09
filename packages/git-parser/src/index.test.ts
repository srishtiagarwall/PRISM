import { execSync } from 'child_process';
import { parseChangedFiles } from './index';

jest.mock('child_process');
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('parseChangedFiles', () => {
  afterEach(() => jest.resetAllMocks());

  it('returns sorted module ownership descriptors with isNewModule=false for existing files', () => {
    mockExecSync
      .mockReturnValueOnce('Alice\nAlice\n' as any)
      .mockReturnValueOnce('Alice\nBob\n' as any)
      .mockReturnValueOnce('Bob\nBob\n' as any);

    const result = parseChangedFiles(
      ['src/payments/retry.ts', 'src/payments/queue.ts', 'src/notifications/email.ts'],
      '/repo',
    );

    expect(result).toHaveLength(2);
    expect(result[0].module).toBe('notifications');
    expect(result[0].isNewModule).toBe(false);
    expect(result[1].module).toBe('payments');
    expect(result[1].owners[0]).toBe('Alice');
    expect(result[1].isNewModule).toBe(false);
  });

  it('marks a module as isNewModule=true when all its files are new', () => {
    mockExecSync.mockReturnValue('' as any);

    const result = parseChangedFiles(['src/brand-new/feature.ts'], '/repo');
    expect(result[0].isNewModule).toBe(true);
    expect(result[0].owners).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(parseChangedFiles([], '/repo')).toEqual([]);
  });
});
