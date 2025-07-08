import { visit } from 'unist-util-visit';
import path from 'path';
import fs from 'fs';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Node } from 'unist';
import type { Root } from 'mdast';

interface ParentNode extends Node {
  children: Node[];
}

interface MdxjsEsmNode extends Node {
  type: 'mdxjsEsm';
  value: string;
}

interface MdxJsxFlowElementNode extends Node {
  type: 'mdxJsxFlowElement';
  name: string;
  attributes?: Array<{
    type: 'mdxJsxAttribute';
    name: string;
    value?: string | number | boolean;
  }>;
  children?: Node[];
}

/**
 * Remark plugin to handle MDX imports by inlining content
 * Resolves imports like "import Component from '/snippets/file.mdx'"
 */
export const remarkMdxImports = () => {
  return (tree: Node) => {
    const contentDir = path.join(process.cwd(), 'content');
    const imports: { [key: string]: Root } = {};

    // First pass: collect and process import statements
    visit(tree, 'mdxjsEsm', (node: MdxjsEsmNode, index, parent: ParentNode) => {
      if (!node.value) return;

      // Match import statements for .mdx files
      const importMatch = node.value.match(
        /import\s+(\w+)\s+from\s+['"`]([^'"`]+\.mdx)['"`]/,
      );
      if (importMatch) {
        const [, importName, importPath] = importMatch;

        // Resolve the file path
        const resolvedPath = resolveMdxImport(importPath, contentDir);
        if (resolvedPath && fs.existsSync(resolvedPath)) {
          // Read and process the imported MDX file
          const importedContent = fs.readFileSync(resolvedPath, 'utf8');
          const { content } = matter(importedContent);

          // Parse the imported content using remark
          const processor = unified().use(remarkParse);
          const importedTree = processor.parse(content) as Root;

          // Store the parsed tree for later use
          imports[importName] = importedTree;

          // Remove the import statement
          if (
            parent &&
            Array.isArray(parent.children) &&
            typeof index === 'number'
          ) {
            parent.children.splice(index, 1);
          }
        }
      }
    });

    // Second pass: replace component usage with inlined content
    visit(
      tree,
      'mdxJsxFlowElement',
      (node: MdxJsxFlowElementNode, index, parent: ParentNode) => {
        if (node.name && imports[node.name]) {
          // Replace the component with the imported content
          const importedTree = imports[node.name];

          if (
            parent &&
            Array.isArray(parent.children) &&
            typeof index === 'number'
          ) {
            // Replace the current node with the imported content's children
            parent.children.splice(index, 1, ...importedTree.children);
          }
        }
      },
    );
  };
};

function resolveMdxImport(
  importPath: string,
  contentDir: string,
): string | null {
  // Handle absolute paths starting with '/'
  if (importPath.startsWith('/')) {
    return path.join(contentDir, importPath.slice(1));
  }

  // Handle relative paths (not implemented in this example)
  return null;
}
