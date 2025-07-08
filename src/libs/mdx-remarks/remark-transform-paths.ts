import { visit } from 'unist-util-visit';
import type { Node } from 'unist';
import path from 'path';

interface ElementNode extends Node {
  type: 'element';
  tagName: string;
  properties?: {
    src?: string;
    href?: string;
    [key: string]: string | boolean | number | undefined;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
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
export const remarkTransformPaths = (filePath: string) => {
  return (tree: Node) => {
    // Transform image elements (JSX)
    visit(tree, 'element', (node: ElementNode) => {
      if (node.tagName === 'img' && node.properties?.src) {
        const oldSrc = node.properties.src;
        const newSrc = transformPath(oldSrc, filePath);
        node.properties.src = newSrc;
      }
    });

    // Transform MDX JSX image elements (MDX v2)
    visit(tree, 'mdxJsxFlowElement', (node: ElementNode) => {
      if ((node.name === 'img' || node.name === 'Image') && node.attributes) {
        const srcAttr = node.attributes.find(
          (attr: Record<string, unknown>) => attr.name === 'src',
        );
        if (srcAttr && typeof srcAttr.value === 'string') {
          const oldSrc = srcAttr.value;
          const newSrc = transformPath(oldSrc, filePath);
          srcAttr.value = newSrc;
        }
      }
    });

    // Transform markdown image syntax
    visit(tree, 'image', (node: ImageNode) => {
      if (node.url) {
        node.url = transformPath(node.url, filePath);
      }
    });

    // Transform link elements (JSX)
    visit(tree, 'element', (node: ElementNode) => {
      if (node.tagName === 'a' && node.properties?.href) {
        // Only transform if it looks like a local file (not external URL)
        if (!node.properties.href.startsWith('http') && !node.properties.href.startsWith('mailto:')) {
          node.properties.href = transformPath(node.properties.href, filePath);
        }
      }
    });

    // Transform markdown link syntax
    visit(tree, 'link', (node: LinkNode) => {
      if (node.url && !node.url.startsWith('http') && !node.url.startsWith('mailto:')) {
        node.url = transformPath(node.url, filePath);
      }
    });
  };
};

function transformPath(originalPath: string, fileDir: string): string {
  // Skip if already transformed or external
  if (
    originalPath.startsWith('http') ||
    originalPath.startsWith('data:') ||
    originalPath.startsWith('mailto:')
  ) {
    return originalPath;
  }

  // Get the directory of the markdown file
  const mdFileDir = path.dirname(fileDir);

  const filePath = path.join(mdFileDir, originalPath);

  // Construct the path to the image relative to the content directory
  const absoluteImagePath = path.resolve(mdFileDir, filePath);

  // Make the path relative to the public directory for serving
  let publicPath = '/' + path.relative(process.cwd(), absoluteImagePath);

  // Remove the 'public' prefix if it exists
  if (publicPath.startsWith('/public/')) {
    publicPath = publicPath.substring(8);
  }

  return publicPath;
}
