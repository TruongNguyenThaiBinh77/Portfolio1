import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.resolve(__dirname, 'content');

// Ensure content directory exists
if (!fs.existsSync(CONTENT_DIR)) {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    for (const file of files) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Items to sync from repo root into portfolio-react/content
const itemsToSync = [
  '_config.yml',
  '_data',
  '_pages',
  '_news',
  '_teachings',
  '_bibliography'
];

let syncedCount = 0;
for (const item of itemsToSync) {
  const src = path.join(ROOT, item);
  const dest = path.join(CONTENT_DIR, item);
  if (fs.existsSync(src)) {
    copyRecursive(src, dest);
    syncedCount++;
  }
}

// Also sync root assets/img to public/assets/img
const imgSrc = path.join(ROOT, 'assets', 'img');
const imgDest = path.join(__dirname, 'public', 'assets', 'img');
if (fs.existsSync(imgSrc)) {
  copyRecursive(imgSrc, imgDest);
}

console.log(`[sync-content] Synced ${syncedCount} content directories/files into portfolio-react/content`);
