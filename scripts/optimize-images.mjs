/**
 * One-off optimizer for the committed marketing images in static/ (~47 MB).
 * Resizes anything wider than 1920px and re-encodes JPEG/PNG/WebP with sane
 * quality. Writes in place; run on a clean git tree so `git diff --stat`
 * shows the savings and you can revert anything that regressed visually.
 *
 * Usage:
 *   npm i -D sharp        # not a runtime dependency; install only for this
 *   node scripts/optimize-images.mjs [--dry-run]
 */
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'static');
const MAX_WIDTH = 1920;
const DRY_RUN = process.argv.includes('--dry-run');
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('sharp is not installed. Run: npm i -D sharp');
  process.exit(1);
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (EXTENSIONS.has(path.extname(entry.name).toLowerCase())) yield full;
  }
}

let totalBefore = 0;
let totalAfter = 0;

for await (const file of walk(ROOT)) {
  const before = (await stat(file)).size;
  const image = sharp(file, { failOn: 'none' });
  const meta = await image.metadata();

  const pipeline = sharp(file, { failOn: 'none' }).rotate();
  if ((meta.width ?? 0) > MAX_WIDTH) pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });

  const ext = path.extname(file).toLowerCase();
  if (ext === '.png') pipeline.png({ compressionLevel: 9, palette: true });
  else if (ext === '.webp') pipeline.webp({ quality: 80 });
  else pipeline.jpeg({ quality: 80, mozjpeg: true });

  const buffer = await pipeline.toBuffer();
  const after = buffer.length;
  totalBefore += before;
  totalAfter += Math.min(after, before);

  const savings = (((before - after) / before) * 100).toFixed(1);
  if (after >= before) {
    console.log(`skip  ${path.relative(ROOT, file)} (already optimal)`);
    continue;
  }

  console.log(`${DRY_RUN ? 'would' : 'write'} ${path.relative(ROOT, file)}: ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB (-${savings}%)`);
  if (!DRY_RUN) {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(file, buffer);
  }
}

console.log(`\nTotal: ${(totalBefore / 1024 / 1024).toFixed(1)}MB → ${(totalAfter / 1024 / 1024).toFixed(1)}MB`);
