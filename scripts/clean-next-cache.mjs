import { readFile } from 'node:fs/promises';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const projectRoot = process.cwd();
const manifestPath = resolve(projectRoot, 'package.json');

let manifest;
try {
  manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
} catch (error) {
  throw new Error('Run this command from the KULHA! project root (package.json was not readable).', { cause: error });
}

if (manifest.name !== 'kulha-morocco-web') {
  throw new Error(`Refusing to clear caches: expected KULHA! project, found "${manifest.name ?? 'unnamed project'}".`);
}

const cachePaths = ['.next', 'node_modules/.cache/next'];
for (const relativePath of cachePaths) {
  await rm(resolve(projectRoot, relativePath), { recursive: true, force: true });
  process.stdout.write(`Cleared ${relativePath}\n`);
}

process.stdout.write('KULHA! Next.js cache reset complete.\n');
