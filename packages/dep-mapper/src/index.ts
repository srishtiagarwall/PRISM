import { extractImports } from './import-extractor';
import { resolveImportToModule, fileToModule } from './module-resolver';
import type { ModuleDependency, FileContentMap } from './types';

export type { ModuleDependency, ParsedImport, ImportKind, FileContentMap } from './types';
export { extractImports } from './import-extractor';
export { resolveImportToModule, fileToModule } from './module-resolver';

/**
 * Builds a dependency map from a map of { filePath → fileContent } strings.
 *
 * No filesystem access — all analysis is done on the content strings provided.
 * This is intentional: the function must work on PR diff content without requiring
 * the target repo's node_modules or a full checkout.
 *
 * Steps:
 *   1. Extract imports from each file's content
 *   2. Classify as internal (relative) or external (npm)
 *   3. Resolve internal imports to module names via directory structure
 *   4. Invert the imports map to build importedBy
 *
 * Returns one entry per module, sorted alphabetically.
 */
export function buildDependencyMap(files: FileContentMap): ModuleDependency[] {
  // module → Set of modules it imports internally
  const importsMap = new Map<string, Set<string>>();

  for (const [filePath, content] of files.entries()) {
    const sourceModule = fileToModule(filePath);

    if (!importsMap.has(sourceModule)) {
      importsMap.set(sourceModule, new Set());
    }

    const parsed = extractImports(content);
    for (const imp of parsed) {
      if (imp.kind !== 'internal') continue;
      const targetModule = resolveImportToModule(filePath, imp.path);
      if (!targetModule || targetModule === sourceModule) continue;
      importsMap.get(sourceModule)!.add(targetModule);
    }
  }

  // Build importedBy by inverting importsMap
  const importedByMap = new Map<string, Set<string>>();
  for (const [source, targets] of importsMap.entries()) {
    for (const target of targets) {
      if (!importedByMap.has(target)) {
        importedByMap.set(target, new Set());
      }
      importedByMap.get(target)!.add(source);
    }
  }

  // Merge all known modules (a module may only appear as a target, not a source)
  const allModules = new Set([...importsMap.keys(), ...importedByMap.keys()]);

  return [...allModules]
    .sort()
    .map((module) => ({
      module,
      imports: [...(importsMap.get(module) ?? [])].sort(),
      importedBy: [...(importedByMap.get(module) ?? [])].sort(),
    }));
}
