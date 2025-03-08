import * as esbuild from 'esbuild';

const config = {
  entryPoints: [
    'src/handlers/auth.ts',
    'src/handlers/public.ts',
    'src/handlers/private.ts'
  ],
  bundle: true,
  minify: false,
  sourcemap: true,
  format: 'esm',
  target: 'node22',
  platform: 'node',
  outdir: 'dist',
  external: ['aws-lambda']
};

esbuild.build(config).catch(() => process.exit(1));
