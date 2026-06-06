import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
  },
  {
    entry: { 'cli/index': 'src/cli/index.ts' },
    format: ['esm'],
    clean: false,
    sourcemap: true,
  },
  {
    entry: { 'tui/App': 'src/tui/App.tsx' },
    format: ['esm'],
    jsx: 'react-jsx',
    tsconfig: 'tsconfig.tui.json',
    clean: false,
    sourcemap: true,
  },
]);
