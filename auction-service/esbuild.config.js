import * as esbuild from 'esbuild';
import { glob } from 'glob';

const entryPoints = await glob('src/handlers/*.ts');

await esbuild.build({
  entryPoints,
  bundle: true,
  outdir: 'dist',
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true,
  external: [
    '@aws-sdk/*',
    '@middy/*'
  ],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  minify: true,
  treeShaking: true
});
