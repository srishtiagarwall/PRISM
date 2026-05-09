export interface ModuleDependency {
  module: string;
  /** Internal modules this module imports (relative imports resolved to module names). */
  imports: string[];
  /** Internal modules that import this module (inverted from imports map). */
  importedBy: string[];
}

export type ImportKind = 'internal' | 'external';

export interface ParsedImport {
  path: string;
  kind: ImportKind;
}

/** Input: file path → raw file content string (not a filesystem path to resolve). */
export type FileContentMap = Map<string, string>;
