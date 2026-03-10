#!/usr/bin/env node
/**
 * create-theme — générateur de thème TypeWav.
 *
 * Usage : npx create-typewav-theme mon-theme
 *
 * Spec : docs/specs/10 — Extensibilité & écosystème open source
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

async function main() {
  const name = process.argv[2];

  if (!name) {
    console.error(
      '[create-typewav-theme] Usage: npx create-typewav-theme <theme-name>',
    );
    process.exit(1);
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const outDir = join(process.cwd(), slug);

  // Vérifier que le dossier n'existe pas
  try {
    await mkdir(outDir, { recursive: false });
  } catch {
    console.error(`[create-typewav-theme] Folder "${slug}" already exists.`);
    process.exit(1);
  }

  const config = `import type { ThemeConfig } from '@typewav/types';

const theme: ThemeConfig = {
  id: '${slug}',
  name: '${name}',
  colors: {
    bg: '#000000',
    surface: '#0A0A0A',
    border: '#1A1A2E',
    accent: '#00D4AA',
    textPrimary: '#E8E8E8',
    textMuted: '#888888',
    error: '#FF4444',
  },
  fonts: {
    display: 'Cormorant Garamond',
    ui: 'Sora',
    mono: 'JetBrains Mono',
  },
};

export default theme;
`;

  const pkg = `{
  "name": "@typewav/theme-${slug}",
  "version": "0.1.0",
  "description": "TypeWav theme: ${name}",
  "main": "./theme.config.ts",
  "dependencies": {
    "@typewav/types": "*"
  }
}
`;

  const readme = `# TypeWav Theme: ${name}

A custom theme for [TypeWav](https://github.com/mouwaficbdr/typewav).

## Requirements

- Contrast: WCAG AA minimum on all text/background pairs
- All design tokens must be defined
- A \`preview.png\` screenshot is required for PR submission

## Structure

\`\`\`
${slug}/
├── theme.config.ts   # Theme configuration (ThemeConfig)
├── package.json
└── README.md
\`\`\`

## Contribute

See [CONTRIBUTING.md](https://github.com/mouwaficbdr/typewav/blob/main/CONTRIBUTING.md).
`;

  await writeFile(join(outDir, 'theme.config.ts'), config);
  await writeFile(join(outDir, 'package.json'), pkg);
  await writeFile(join(outDir, 'README.md'), readme);

  console.log(`\n✓ Theme "${name}" created in ./${slug}/`);
  console.log(`\nNext steps:
  1. Edit ${slug}/theme.config.ts — customize colors and fonts
  2. Add a preview.png screenshot
  3. Copy to packages/themes/${slug}/ in the TypeWav monorepo
  4. Open a Pull Request\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
