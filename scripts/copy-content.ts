import fs from 'fs-extra'; // Using fs-extra for recursive copy
import path from 'path';
import crypto from 'crypto';

const sourcePath = path.join(process.cwd(), 'content');
const destinationPath = path.join(process.cwd(), 'public', 'content');
const hashFilePath = path.join(destinationPath, '.content-hash');

function hashDir(dir: string): string {
  const hash = crypto.createHash('sha256');
  function walk(currentPath: string) {
    const entries = fs.readdirSync(currentPath);
    entries.sort(); // Ensure consistent order
    for (const entry of entries) {
      if (entry === '.git') continue;
      const fullPath = path.join(currentPath, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile()) {
        hash.update(entry);
        hash.update(fs.readFileSync(fullPath));
      }
    }
  }
  walk(dir);
  return hash.digest('hex');
}

async function copyContent() {
  if (!fs.existsSync(sourcePath)) {
    console.error('❌ Source content directory does not exist:', sourcePath);
    process.exit(1);
  }

  const newHash = hashDir(sourcePath);

  let oldHash = '';
  if (fs.existsSync(hashFilePath)) {
    oldHash = fs.readFileSync(hashFilePath, 'utf8');
  }

  if (newHash === oldHash) {
    console.log('⏩ Content unchanged, skipping copy.');
    return;
  }

  console.log(`🔄 Copying content from ${sourcePath} to ${destinationPath}...`);
  try {
    await fs.copy(sourcePath, destinationPath, {
      overwrite: true,
      dereference: true, // Follow symlinks
      filter: (src) => {
        // Exclude .git directories from submodules
        return !src.includes(path.sep + '.git');
      }
    });
    fs.writeFileSync(hashFilePath, newHash, 'utf8');
    console.log('✅ Content copied successfully!');
  } catch (err) {
    console.error('❌ Error copying content:', err);
    process.exit(1); // Exit with error code
  }
}

copyContent();
