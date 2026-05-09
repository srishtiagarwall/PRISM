import { groupFilesIntoModules } from './module-grouper';

describe('groupFilesIntoModules', () => {
  it('groups files under src/ by their first subdirectory', () => {
    const files = [
      'src/payments/retry.ts',
      'src/payments/queue.ts',
      'src/notifications/email.ts',
    ];
    const result = groupFilesIntoModules(files);

    expect(result.get('payments')).toEqual([
      'src/payments/retry.ts',
      'src/payments/queue.ts',
    ]);
    expect(result.get('notifications')).toEqual(['src/notifications/email.ts']);
  });

  it('treats top-level files as root module', () => {
    const files = ['README.md', 'package.json'];
    const result = groupFilesIntoModules(files);
    expect(result.get('root')).toEqual(['README.md', 'package.json']);
  });

  it('handles files without a src/ prefix', () => {
    const files = ['payments/retry.ts', 'auth/login.ts'];
    const result = groupFilesIntoModules(files);
    expect(result.get('payments')).toEqual(['payments/retry.ts']);
    expect(result.get('auth')).toEqual(['auth/login.ts']);
  });

  it('handles Windows-style backslash paths', () => {
    const files = ['src\\payments\\retry.ts', 'src\\auth\\login.ts'];
    const result = groupFilesIntoModules(files);
    expect(result.get('payments')).toEqual(['src\\payments\\retry.ts']);
    expect(result.get('auth')).toEqual(['src\\auth\\login.ts']);
  });

  it('returns empty map for empty input', () => {
    expect(groupFilesIntoModules([])).toEqual(new Map());
  });

  it('strips apps/ and packages/ root containers', () => {
    const files = ['apps/webhook/src/main.ts', 'packages/dep-mapper/src/index.ts'];
    const result = groupFilesIntoModules(files);
    expect(result.get('webhook')).toEqual(['apps/webhook/src/main.ts']);
    expect(result.get('dep-mapper')).toEqual(['packages/dep-mapper/src/index.ts']);
  });
});
