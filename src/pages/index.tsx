import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { GetStaticProps } from 'next';
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

export const getStaticProps: GetStaticProps = async () => {
  const filePaths = ['index', 'readme'].map((name) => {
    return path.resolve(path.join(CONTENT_PATH, `${name}.mdx`));
  });

  const existedPath = filePaths.find((filePath) => fs.existsSync(filePath));
  // Check if file exists
  if (!existedPath) {
    return { notFound: true };
  }

  const source = fs.readFileSync(existedPath, 'utf8');
  const { data, content } = matter(source);
  const docsConfig = loadDocsConfig();

  // Serialize the MDX content
  const mdxSource = await serialize({
    source: content,
    options: {
      parseFrontmatter: false, // Frontmatter already parsed by gray-matter
      mdxOptions: {
        recmaPlugins: [recmaMdxEscapeMissingComponents],
        remarkPlugins: [() => remarkTransformPaths(existedPath), remarkMdxImports], // Ensure order: imports first, then path transforms
      },
    },
  });

  // In development, force fresh data by including file modification time
  const fileStats = fs.statSync(existedPath);
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
