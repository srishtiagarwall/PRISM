import { execSync } from 'child_process';
import type { GitLogEntry } from './types';

export interface FileOwnerResult {
  owners: string[];
  /** Explicitly true when git ran successfully but returned no commits (new/untracked file). */
  hasNoHistory: boolean;
}

/**
 * Returns top-N contributors for a file using git log --follow.
 *
 * Distinguishes two empty-owner cases:
 *   hasNoHistory=true  → git succeeded, file has zero commits (new file in PR)
 *   hasNoHistory=false + owners=[] → git itself failed (not a repo, binary, etc.)
 */
export function getFileOwners(
  filePath: string,
  repoRoot: string,
  topN = 2,
): FileOwnerResult {
  let output: string;
  try {
    output = execSync(
      `git log --follow --format="%aN" -- "${filePath}"`,
      { cwd: repoRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
    );
  } catch {
    return { owners: [], hasNoHistory: false };
  }

  const counts = new Map<string, number>();
  for (const line of output.split('\n')) {
    const name = line.trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  if (counts.size === 0) {
    // git ran fine but the file has no commits — explicitly a new file
    return { owners: [], hasNoHistory: true };
  }

  const owners = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([author]) => author);

  return { owners, hasNoHistory: false };
}

export interface ModuleOwnerResult {
  owners: string[];
  /** True when every file in the module has no git history. */
  isNewModule: boolean;
}

/**
 * Aggregates owners across all files in a module.
 * isNewModule=true only when ALL files returned hasNoHistory=true.
 */
export function resolveModuleOwners(
  files: string[],
  repoRoot: string,
  topN = 2,
): ModuleOwnerResult {
  const counts = new Map<string, number>();
  let newFileCount = 0;

  for (const file of files) {
    const result = getFileOwners(file, repoRoot, topN);
    if (result.hasNoHistory) {
      newFileCount++;
    }
    for (const owner of result.owners) {
      counts.set(owner, (counts.get(owner) ?? 0) + 1);
    }
  }

  const isNewModule = newFileCount === files.length;

  const owners = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([author]) => author);

  return { owners, isNewModule };
}
