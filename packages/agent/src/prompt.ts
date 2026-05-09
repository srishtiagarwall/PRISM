import type { AgentInput } from './types';

export function buildPrompt(input: AgentInput): string {
  const { modules, dependencies, prTitle, prAuthor } = input;

  const moduleSummaries = modules
    .map((m) => {
      const ownerLine = m.isNewModule
        ? 'Owners: (new module — no ownership data)'
        : m.owners.length > 0
          ? `Owners: ${m.owners.join(', ')}`
          : 'Owners: (unknown)';

      const dep = dependencies.find((d) => d.module === m.module);
      const importsLine = dep?.imports.length
        ? `Imports: ${dep.imports.join(', ')}`
        : 'Imports: none';
      const importedByLine = dep?.importedBy.length
        ? `Imported by (blast radius): ${dep.importedBy.join(', ')}`
        : 'Imported by: none';

      return [
        `Module: ${m.module}`,
        ownerLine,
        importsLine,
        importedByLine,
        `Files changed: ${m.files.join(', ')}`,
      ].join('\n');
    })
    .join('\n\n');

  return `You are a senior engineer writing a codebase context card for a pull request reviewer.

PR Title: ${prTitle}
PR Author: ${prAuthor}

Module analysis:
${moduleSummaries}

Write a PRISM context card in EXACTLY this markdown format — no preamble, no explanation, just the card:

## 🔍 PRISM — Codebase Context Card

**Modules Touched:** <comma-separated module names>
**Owners:** <@owner (module) pairs, or "New module — no ownership data" if applicable>
**Blast Radius:** <modules that import the changed modules, or "None identified">

**What This PR Changes:**
<One paragraph. Plain English. What does this PR actually do functionally? What modules are affected and how? What might break downstream?>

**Risk Signal:** <One sentence. Is this a high-churn area? Are there many dependents? Any new modules with no owners? If nothing notable, write "No elevated risk signals.">`;
}
