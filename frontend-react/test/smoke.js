import { existsSync } from 'node:fs';

const requiredFiles = [
  'index.html',
  'src/main.jsx',
  'src/App.jsx',
  'src/styles.css'
];

const missing = requiredFiles.filter((file) => !existsSync(new URL(`../${file}`, import.meta.url)));

if (missing.length > 0) {
  console.error('Missing required files:', missing.join(', '));
  process.exit(1);
}

console.log('Smoke test passed.');

