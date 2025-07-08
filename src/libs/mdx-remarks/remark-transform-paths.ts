import { visit } from 'unist-util-visit';
import path from 'path';
import fs from 'fs';
import type { Node } from 'unist';

interface ElementNode extends Node {
  type: 'element';
  tagName: string;
  properties?: {
    src?: string;
    href?: string;
    [key: string]: string | boolean | number | undefined;
  };
}

interface ImageNode extends Node {
  type: 'image';
  url: string;
}

interface LinkNode extends Node {
  type: 'link';
  url: string;
}

/**
 * Remark plugin to transform relative paths in MDX files
 * Converts paths like "/images/hero.png" to work with content directory structure
 */
export const remarkTransformPaths = () => {
  return (tree: Node) => {
    // Get the source file path to determine the content directory
    const contentDir = path.join(process.cwd(), 'content');
    
    // Transform image elements (JSX)
    visit(tree, 'element', (node: ElementNode) => {
      if (node.tagName === 'img' && node.properties?.src) {
        node.properties.src = transformPath(node.properties.src, contentDir);
      }
    });

    // Transform markdown image syntax
    visit(tree, 'image', (node: ImageNode) => {
      if (node.url) {
        node.url = transformPath(node.url, contentDir);
      }
    });

    // Transform link elements (JSX)
    visit(tree, 'element', (node: ElementNode) => {
      if (node.tagName === 'a' && node.properties?.href) {
        // Only transform if it looks like a local file (not external URL)
        if (!node.properties.href.startsWith('http') && !node.properties.href.startsWith('mailto:')) {
          node.properties.href = transformPath(node.properties.href, contentDir);
        }
      }
    });

    // Transform markdown link syntax
    visit(tree, 'link', (node: LinkNode) => {
      if (node.url && !node.url.startsWith('http') && !node.url.startsWith('mailto:')) {
        node.url = transformPath(node.url, contentDir);
      }
    });
  };
};

function transformPath(originalPath: string, contentDir: string): string {
  // Skip if already transformed or external
  if (originalPath.startsWith('http') || originalPath.startsWith('data:') || originalPath.startsWith('mailto:')) {
    return originalPath;
  }

  // Handle absolute paths that should be relative to content directory
  if (originalPath.startsWith('/')) {
    const contentFilePath = path.join(contentDir, originalPath.slice(1));
    
    // Check if file exists in content directory
    if (fs.existsSync(contentFilePath)) {
      // Copy to public directory and return public path
      const publicPath = path.join(process.cwd(), 'public', originalPath.slice(1));
      const publicDir = path.dirname(publicPath);
      
      // Ensure public directory exists
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      // Copy file if it doesn't exist or is newer
      if (!fs.existsSync(publicPath) || 
          fs.statSync(contentFilePath).mtime > fs.statSync(publicPath).mtime) {
        fs.copyFileSync(contentFilePath, publicPath);
        console.log(`📸 Synced asset: ${originalPath}`);
      }
      
      return originalPath; // Return original path (now available in public)
    }
  }

  // Return unchanged if no transformation needed
  return originalPath;
}
