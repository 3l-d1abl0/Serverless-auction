import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/handlers/sendMail.ts'],
  bundle: true,
  outdir: 'dist',
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true,
  external: ['@aws-sdk/client-ses'],
  outExtension: { '.js': '.js' },
  minify: true,
  treeShaking: true,
});
