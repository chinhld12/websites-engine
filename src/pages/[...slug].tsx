import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { GetStaticPaths, GetStaticProps } from 'next';
import { DocsConfig, loadDocsConfig } from '@wse/libs/docs-config';
import { serialize } from 'next-mdx-remote-client/serialize';
import { MDXClient } from 'next-mdx-remote-client';
import type { SerializeResult } from 'next-mdx-remote-client/serialize';
import { remarkTransformPaths } from '@wse/libs/mdx-remarks/remark-transform-paths';
import { remarkMdxImports } from '@wse/libs/mdx-remarks/remark-mdx-imports';
import recmaMdxEscapeMissingComponents from 'recma-mdx-escape-missing-components';

type FrontMatter = {
  title: string;
  description?: string;
  date?: string;
};

type DocPageProps = {
  frontMatter: FrontMatter;
  mdxSource: SerializeResult<FrontMatter>; // Corrected type
  docsConfig: DocsConfig | null;
  // Add a dummy prop for hot-reloading
  _allMdxFilesHash: string;
};

const CONTENT_PATH = path.join(process.cwd(), 'public', 'content');

export default function DocPage({
  frontMatter,
  mdxSource,
  docsConfig,
}: DocPageProps) {
  // Handle error from serialization
  if ('error' in mdxSource) {
    return (
      <main style={{ maxWidth: 700, margin: '0 auto', padding: 32 }}>
        <h1>Error loading content</h1>
        <p>{mdxSource.error.message}</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: 32 }}>
      <nav>
        {/* Example: Render navigation from docsConfig */}
        {docsConfig?.navigation && (
          <pre style={{ background: '#eee', padding: 8 }}>
            {JSON.stringify(docsConfig.navigation, null, 2)}
          </pre>
        )}
      </nav>
      <h1>{frontMatter.title}</h1>
      <p>{frontMatter.description}</p>
      <MDXClient {...mdxSource} />
    </main>
  );
}

function getAllMdxFiles(dir: string, basePath: string = ''): Array<{ params: { slug: string[] } }> {
  const files = fs.readdirSync(dir);
  const paths: Array<{ params: { slug: string[] } }> = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Recursively get files from subdirectories
      const subPaths = getAllMdxFiles(fullPath, path.join(basePath, file));
      paths.push(...subPaths);
    } else if (file.endsWith('.mdx')) {
      const fileName = file.replace(/\.mdx$/, '');
      const slugArray = basePath ? [...basePath.split('/'), fileName] : [fileName];
      paths.push({ params: { slug: slugArray } });
    }
  }

  return paths;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllMdxFiles(CONTENT_PATH);

  return { 
    paths, 
    fallback: false 
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string[];
  if (!slug || slug.length === 0) {
    return { notFound: true };
  }
  
  const filePath = path.join(CONTENT_PATH, ...slug) + '.mdx';
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return { notFound: true };
  }
  
  const source = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(source);
  const docsConfig = loadDocsConfig();

  // Serialize the MDX content
  const mdxSource = await serialize({
    source: content,
    options: {
      parseFrontmatter: false, // Frontmatter already parsed by gray-matter
      mdxOptions: {
        recmaPlugins: [recmaMdxEscapeMissingComponents],
        remarkPlugins: [remarkMdxImports, () => remarkTransformPaths(filePath)], // Ensure order: imports first, then path transforms
      },
    },
  });

  // In development, force fresh data by including file modification time
  const fileStats = fs.statSync(filePath);
  const lastModified = fileStats.mtimeMs;

  return {
    props: {
      frontMatter: data,
      mdxSource,
      docsConfig,
      _allMdxFilesHash: lastModified.toString(),
    },
  };
};
