import * as path from 'path';

/**
 * Groups file paths into logical modules by their top-level directory segment
 * after stripping common root prefixes (src/, app/, packages/, apps/).
 *
 * Examples:
 *   src/payments/retry.ts       → payments
 *   src/payments/queue.ts       → payments
 *   src/notifications/email.ts  → notifications
 *   README.md                   → root
 */
export function groupFilesIntoModules(files: string[]): Map<string, string[]> {
  const modules = new Map<string, string[]>();

  for (const file of files) {
    const moduleName = deriveModuleName(file);
    const existing = modules.get(moduleName) ?? [];
    existing.push(file);
    modules.set(moduleName, existing);
  }

  return modules;
}

function deriveModuleName(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const parts = normalized.split('/');

  // Strip known root-level container directories
  const containers = new Set(['src', 'app', 'apps', 'packages', 'lib']);
  const start = containers.has(parts[0]) ? 1 : 0;

  const segment = parts[start];
  if (!segment || segment.includes('.')) {
    // Top-level file with no directory grouping
    return 'root';
  }

  // For packages/apps monorepos, use first two segments to preserve package identity
  if (containers.has(parts[0]) && parts.length > 2) {
    return parts[start];
  }

  return segment;
}
