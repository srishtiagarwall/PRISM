import type { ParsedImport } from './types';

/**
 * Extracts all import/require paths from a TypeScript or JavaScript file's content string.
 * Works entirely on raw text — no filesystem access, no node_modules resolution.
 *
 * Handles:
 *   import foo from './foo'
 *   import { bar } from '../bar'
 *   import type { Baz } from '../../baz'
 *   import * as ns from 'some-package'
 *   import './side-effect'
 *   export { x } from './x'
 *   export * from './y'
 *   const x = require('./x')
 *   const x = require('package')
 *   dynamic: import('./lazy')   ← captured
 */

// Matches: import ... from 'path'  |  export ... from 'path'
const STATIC_IMPORT_RE =
  /(?:import|export)(?:\s+type)?\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;

// Matches: require('path') or require("path")
const REQUIRE_RE = /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

// Matches: import('path') — dynamic imports
const DYNAMIC_IMPORT_RE = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

export function extractImports(fileContent: string): ParsedImport[] {
  const seen = new Set<string>();
  const results: ParsedImport[] = [];

  function collect(re: RegExp) {
    // Reset lastIndex so re-use across calls is safe
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(fileContent)) !== null) {
      const importPath = match[1];
      if (!importPath || seen.has(importPath)) continue;
      seen.add(importPath);
      results.push({
        path: importPath,
        kind: importPath.startsWith('.') ? 'internal' : 'external',
      });
    }
  }

  collect(STATIC_IMPORT_RE);
  collect(REQUIRE_RE);
  collect(DYNAMIC_IMPORT_RE);

  return results;
}
