import { execSync } from 'child_process';
import { parseChangedFiles } from './index';

jest.mock('child_process');
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('parseChangedFiles', () => {
  afterEach(() => jest.resetAllMocks());

  it('returns sorted module ownership descriptors', () => {
    // payments files: Alice dominates, notifications: Bob
    mockExecSync
      .mockReturnValueOnce('Alice\nAlice\n' as any) // payments/retry.ts
      .mockReturnValueOnce('Alice\nBob\n' as any)   // payments/queue.ts
      .mockReturnValueOnce('Bob\nBob\n' as any);    // notifications/email.ts

    const result = parseChangedFiles(
      [
        'src/payments/retry.ts',
        'src/payments/queue.ts',
        'src/notifications/email.ts',
      ],
      '/repo',
    );

    expect(result).toHaveLength(2);
    // sorted alphabetically: notifications before payments
    expect(result[0].module).toBe('notifications');
    expect(result[0].files).toEqual(['src/notifications/email.ts']);
    expect(result[0].owners).toEqual(['Bob']);

    expect(result[1].module).toBe('payments');
    expect(result[1].files).toEqual([
      'src/payments/retry.ts',
      'src/payments/queue.ts',
    ]);
    expect(result[1].owners[0]).toBe('Alice');
  });

  it('returns empty array for empty input', () => {
    expect(parseChangedFiles([], '/repo')).toEqual([]);
  });
});
