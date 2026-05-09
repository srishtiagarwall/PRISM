import * as path from 'path';

/**
 * Resolves a relative import path from a source file to its target module name,
 * using the same module-grouping logic as git-parser (top-level directory after
 * stripping src/, app/, apps/, packages/, lib/).
 *
 * Example:
 *   sourceFile = 'src/payments/retry.ts'
 *   importPath = '../notifications/email'
 *   → resolves to 'notifications'
 *
 * Returns null if the resolved path escapes all known module roots (e.g. goes above src/).
 */

const CONTAINER_DIRS = new Set(['src', 'app', 'apps', 'packages', 'lib']);

export function resolveImportToModule(
  sourceFile: string,
  importPath: string,
): string | null {
  const sourceDir = path.dirname(sourceFile.replace(/\\/g, '/'));
  const resolved = path.posix.normalize(path.posix.join(sourceDir, importPath));

  const parts = resolved.split('/');
  const start = CONTAINER_DIRS.has(parts[0]) ? 1 : 0;
  const segment = parts[start];

  if (!segment || segment === '..' || segment.includes('.')) {
    return null;
  }

  return segment;
}

/**
 * Derives the module name for a given file path — mirrors git-parser's grouper.
 */
export function fileToModule(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  const start = CONTAINER_DIRS.has(parts[0]) ? 1 : 0;
  const segment = parts[start];
  if (!segment || segment.includes('.')) return 'root';
  return segment;
}
