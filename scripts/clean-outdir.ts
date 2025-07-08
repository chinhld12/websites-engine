// Script for cleaning all md and mdx files in the out directory recursively by using glob patterns
import { glob } from 'glob';
import { rimraf } from 'rimraf';
import path from 'path';

async function cleanOutDir() {
  const outDir = path.join(process.cwd(), 'out', 'content');

  // Clean all .mdx files
  const mdxFiles = await glob('**/*.mdx', { cwd: outDir, absolute: true });
  await Promise.all(mdxFiles.map(file => rimraf(file)));

  // Clean all .md files
  const mdFiles = await glob('**/*.md', { cwd: outDir, absolute: true });
  await Promise.all(mdFiles.map(file => rimraf(file)));

  // Clean the .content-hash file
  const contentHashFile = path.join(outDir, '.content-hash');
  await rimraf(contentHashFile);

  console.log('Cleaned out directory of all .md and .mdx files.');
}

cleanOutDir().catch(err => {
  console.error('Error cleaning out directory:', err);
  process.exit(1);
});