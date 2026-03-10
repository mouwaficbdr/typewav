#!/usr/bin/env node
/**
 * create-collection — générateur de collection de textes TypeWav.
 *
 * Usage : npx create-typewav-collection ma-collection
 *
 * Spec : docs/specs/10 — Extensibilité & écosystème open source
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

async function main() {
  const name = process.argv[2];

  if (!name) {
    console.error(
      '[create-typewav-collection] Usage: npx create-typewav-collection <collection-name>',
    );
    process.exit(1);
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const outDir = join(process.cwd(), slug);

  try {
    await mkdir(outDir, { recursive: false });
  } catch {
    console.error(
      `[create-typewav-collection] Folder "${slug}" already exists.`,
    );
    process.exit(1);
  }

  const config = `import type { CollectionConfig } from '@typewav/types';

const collection: CollectionConfig = {
  id: '${slug}',
  name: '${name}',
  language: 'fr',
  difficulty: 'normal',
  // Minimum 20 entrées requises pour la soumission PR
  texts: [
    {
      id: '${slug}-001',
      content: 'Remplacez ce texte par un texte du domaine public.',
      source: 'Auteur — Œuvre (année)',
      difficulty: 'normal',
      tags: [],
    },
    // ... ajoutez au moins 19 autres entrées
  ],
};

export default collection;
`;

  const pkg = `{
  "name": "@typewav/collection-${slug}",
  "version": "0.1.0",
  "description": "TypeWav collection: ${name}",
  "main": "./collection.config.ts",
  "dependencies": {
    "@typewav/types": "*"
  }
}
`;

  const readme = `# TypeWav Collection: ${name}

A custom text collection for [TypeWav](https://github.com/mouwaficbdr/typewav).

## Requirements

- All texts must be public domain (author deceased 70+ years, or explicit CC0 license)
- Minimum 20 text entries
- Each entry must include a verifiable \`source\` (Author — Work, year)
- Language declared in the config (\`fr\` or \`en\`)

## Structure

\`\`\`
${slug}/
├── collection.config.ts   # Collection configuration (CollectionConfig)
├── package.json
└── README.md
\`\`\`

## Contribute

See [CONTRIBUTING.md](https://github.com/mouwaficbdr/typewav/blob/main/CONTRIBUTING.md).
`;

  await writeFile(join(outDir, 'collection.config.ts'), config);
  await writeFile(join(outDir, 'package.json'), pkg);
  await writeFile(join(outDir, 'README.md'), readme);

  console.log(`\n✓ Collection "${name}" created in ./${slug}/`);
  console.log(`\nNext steps:
  1. Edit ${slug}/collection.config.ts — add at least 20 public-domain text entries
  2. Verify each entry has a source and is truly public domain
  3. Copy to packages/collections/${slug}/ in the TypeWav monorepo
  4. Open a Pull Request\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
