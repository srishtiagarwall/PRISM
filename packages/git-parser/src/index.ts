import { groupFilesIntoModules } from './module-grouper';
import { resolveModuleOwners } from './ownership-resolver';
import type { ModuleOwnership } from './types';

export type { ModuleOwnership, GitLogEntry } from './types';
export { groupFilesIntoModules } from './module-grouper';
export { getFileOwners, resolveModuleOwners } from './ownership-resolver';

/**
 * Main entry point: takes a list of changed file paths and a repo root,
 * returns module ownership descriptors sorted by module name.
 */
export function parseChangedFiles(
  changedFiles: string[],
  repoRoot: string,
): ModuleOwnership[] {
  const grouped = groupFilesIntoModules(changedFiles);
  const result: ModuleOwnership[] = [];

  for (const [module, files] of grouped.entries()) {
    const { owners, isNewModule } = resolveModuleOwners(files, repoRoot);
    result.push({ module, files, owners, isNewModule });
  }

  return result.sort((a, b) => a.module.localeCompare(b.module));
}
