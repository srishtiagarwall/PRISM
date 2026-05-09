import { execSync } from 'child_process';
import * as path from 'path';
import type { GitLogEntry } from './types';

/**
 * Returns the top N contributors for a file by commit count, using git log --follow
 * to track renames. Falls back to an empty array if git is unavailable or the file
 * has no history (e.g. brand-new file not yet committed).
 */
export function getFileOwners(
  filePath: string,
  repoRoot: string,
  topN = 2,
): string[] {
  try {
    const output = execSync(
      `git log --follow --format="%aN" -- "${filePath}"`,
      { cwd: repoRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
    );

    const counts = new Map<string, number>();
    for (const line of output.split('\n')) {
      const name = line.trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([author]) => author);
  } catch {
    return [];
  }
}

/**
 * Aggregates owners across all files in a module, ranking by total commit count.
 */
export function resolveModuleOwners(
  files: string[],
  repoRoot: string,
  topN = 2,
): string[] {
  const counts = new Map<string, number>();

  for (const file of files) {
    const owners = getFileOwners(file, repoRoot);
    for (const owner of owners) {
      counts.set(owner, (counts.get(owner) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([author]) => author);
}
