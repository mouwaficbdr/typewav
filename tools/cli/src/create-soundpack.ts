#!/usr/bin/env node
/**
 * create-soundpack — générateur de soundpack TypeWav.
 *
 * Usage : npx create-typewav-soundpack mon-pack
 *
 * Spec : docs/specs/10 — Extensibilité & écosystème open source
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

async function main() {
  const name = process.argv[2];

  if (!name) {
    console.error(
      '[create-typewav-soundpack] Usage: npx create-typewav-soundpack <pack-name>',
    );
    process.exit(1);
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const outDir = join(process.cwd(), slug);

  try {
    await mkdir(outDir, { recursive: false });
    await mkdir(join(outDir, 'samples'), { recursive: false });
  } catch {
    console.error(
      `[create-typewav-soundpack] Folder "${slug}" already exists.`,
    );
    process.exit(1);
  }

  const config = `import type { SoundPackConfig } from '@typewav/types';

const soundpack: SoundPackConfig = {
  id: '${slug}',
  name: '${name}',
  instrument: 'sampler',
  // Ajouter les samples ici — format : { note: 'url' }
  // Les fichiers audio doivent être < 2MB total et en domaine public
  samples: {
    // Exemple :
    // C4: './samples/C4.mp3',
    // D4: './samples/D4.mp3',
  },
  baseUrl: '',
};

export default soundpack;
`;

  const pkg = `{
  "name": "@typewav/soundpack-${slug}",
  "version": "0.1.0",
  "description": "TypeWav soundpack: ${name}",
  "main": "./soundpack.config.ts",
  "dependencies": {
    "@typewav/types": "*"
  }
}
`;

  const readme = `# TypeWav Soundpack: ${name}

A custom soundpack for [TypeWav](https://github.com/mouwaficbdr/typewav).

## Requirements

- All samples must be royalty-free / public domain
- Total size < 2MB
- Formats: .mp3 or .ogg
- At minimum: notes C4 through C5 (pentatonic: C D E G A)

## Structure

\`\`\`
${slug}/
├── soundpack.config.ts   # Soundpack configuration (SoundPackConfig)
├── samples/              # Audio files (.mp3 / .ogg)
├── package.json
└── README.md
\`\`\`

## Contribute

See [CONTRIBUTING.md](https://github.com/mouwaficbdr/typewav/blob/main/CONTRIBUTING.md).
`;

  await writeFile(join(outDir, 'soundpack.config.ts'), config);
  await writeFile(join(outDir, 'package.json'), pkg);
  await writeFile(join(outDir, 'README.md'), readme);
  await writeFile(join(outDir, 'samples', '.gitkeep'), '');

  console.log(`\n✓ Soundpack "${name}" created in ./${slug}/`);
  console.log(`\nNext steps:
  1. Add public-domain audio samples to ${slug}/samples/
  2. Edit ${slug}/soundpack.config.ts — map notes to sample files
  3. Copy to packages/soundpacks/${slug}/ in the TypeWav monorepo
  4. Open a Pull Request\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
