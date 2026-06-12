import {defineConfig} from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm'],
  platform: 'node',
  target: 'node18',
  outDir: 'dist',
  clean: true,
  bundle: true,
  splitting: false,
  sourcemap: false,
  dts: false,
  banner: {
    js: "import {createRequire as __yankCreateRequire} from 'node:module';\nconst require = __yankCreateRequire(import.meta.url);"
  },
  external: [
    // clipboardy resolves platform fallback binaries by package-relative paths.
    'clipboardy'
  ],
  noExternal: ['ink', 'ink-text-input', 'nanoid', 'react'],
  esbuildOptions(options) {
    options.alias = {
      ...options.alias,
      'react-devtools-core': './src/react-devtools-core-stub.ts'
    };
  }
});
