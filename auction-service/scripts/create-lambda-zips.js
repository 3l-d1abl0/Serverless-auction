import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import { createGzip } from 'zlib';
import archiver from 'archiver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const zipDir = path.join(projectRoot, 'dist-zip');

// Ensure zip directory exists
if (!fs.existsSync(zipDir)) {
  fs.mkdirSync(zipDir, { recursive: true });
}

// Get all handler directories
const handlerDirs = fs.readdirSync(distDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

// Create a zip file for each handler
for (const handler of handlerDirs) {
  const sourceDir = path.join(distDir, handler);
  const zipFile = path.join(zipDir, `${handler}.zip`);
  
  console.log(`Creating zip for ${handler}...`);
  
  // Create a file to stream archive data to
  const output = createWriteStream(zipFile);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level
  });
  
  // Listen for all archive data to be written
  output.on('close', () => {
    console.log(`${zipFile} created: ${archive.pointer()} total bytes`);
  });
  
  // Handle warnings and errors
  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      console.warn(err);
    } else {
      throw err;
    }
  });
  
  archive.on('error', (err) => {
    throw err;
  });
  
  // Pipe archive data to the file
  archive.pipe(output);
  
  // Add all files from the handler directory
  archive.directory(sourceDir, false);
  
  // Finalize the archive
  archive.finalize();
}
