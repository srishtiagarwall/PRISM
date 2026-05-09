import { extractImports } from './import-extractor';

describe('extractImports', () => {
  it('extracts named imports', () => {
    const content = `import { foo } from './foo';`;
    const result = extractImports(content);
    expect(result).toEqual([{ path: './foo', kind: 'internal' }]);
  });

  it('extracts default imports', () => {
    const content = `import bar from '../bar';`;
    const result = extractImports(content);
    expect(result).toEqual([{ path: '../bar', kind: 'internal' }]);
  });

  it('classifies npm packages as external', () => {
    const content = `import express from 'express';`;
    const result = extractImports(content);
    expect(result).toEqual([{ path: 'express', kind: 'external' }]);
  });

  it('handles side-effect imports', () => {
    const content = `import './polyfills';`;
    const result = extractImports(content);
    expect(result).toEqual([{ path: './polyfills', kind: 'internal' }]);
  });

  it('handles export ... from', () => {
    const content = `export { x } from './x';\nexport * from './y';`;
    const result = extractImports(content);
    const paths = result.map((r) => r.path);
    expect(paths).toContain('./x');
    expect(paths).toContain('./y');
  });

  it('handles require()', () => {
    const content = `const x = require('./utils');`;
    const result = extractImports(content);
    expect(result).toEqual([{ path: './utils', kind: 'internal' }]);
  });

  it('handles dynamic import()', () => {
    const content = `const mod = import('./lazy');`;
    const result = extractImports(content);
    expect(result).toEqual([{ path: './lazy', kind: 'internal' }]);
  });

  it('handles import type', () => {
    const content = `import type { Foo } from './types';`;
    const result = extractImports(content);
    expect(result).toEqual([{ path: './types', kind: 'internal' }]);
  });

  it('deduplicates repeated imports of the same path', () => {
    const content = `import { a } from './shared';\nimport { b } from './shared';`;
    const result = extractImports(content);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('./shared');
  });

  it('returns empty array for file with no imports', () => {
    const content = `const x = 1;\nexport default x;`;
    expect(extractImports(content)).toEqual([]);
  });

  it('handles scoped packages as external', () => {
    const content = `import { something } from '@nestjs/common';`;
    const result = extractImports(content);
    expect(result).toEqual([{ path: '@nestjs/common', kind: 'external' }]);
  });
});
