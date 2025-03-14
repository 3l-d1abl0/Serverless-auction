import * as esbuild from 'esbuild';
import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

const entryPoints = await glob('src/handlers/*.ts');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Build each handler into its own directory to match Lambda expectations
for (const entryPoint of entryPoints) {
  const handler = entryPoint.replace('src/handlers/', '').replace('.ts', '');
  const outputDir = `dist/${handler}`;
  
  // Ensure handler directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    outfile: path.join(outputDir, 'index.js'),
    platform: 'node',
    target: 'node22',
    format: 'esm',
    sourcemap: true,
    external: [
      '@aws-sdk/*'
    ],
    define: {
      'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'dev'}"`,
      'process.env.AWS_REGION': '"ap-south-1"'
    },
    minify: true,
    treeShaking: true,
    metafile: true,
    banner: {
      js: '// Generated by esbuild for AWS Lambda\n'
    }
  });
  
  // Create a package.json file in each handler directory to specify type: module
  const packageJson = {
    type: "module"
  };
  
  fs.writeFileSync(
    path.join(outputDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
}

console.log('Build complete! TypeScript handlers bundled for Lambda deployment.');
