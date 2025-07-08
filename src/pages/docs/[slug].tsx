import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { GetStaticPaths, GetStaticProps } from 'next';
import dynamic from 'next/dynamic';
import { loadDocsConfig, DocsConfig } from './docsConfig';

type FrontMatter = {
  title: string;
  description?: string;
  date?: string;
};

type DocPageProps = {
  frontMatter: FrontMatter;
  mdxSource: string;
  docsConfig: DocsConfig | null;
};

const CONTENT_PATH = path.resolve(process.cwd(), '../mdx-source/content'); // Update as needed

export default function DocPage({ frontMatter, mdxSource, docsConfig }: DocPageProps) {
  const MDXContent = dynamic(() => import(`../../../${mdxSource}`));
  // Example: use docsConfig for navigation, colors, etc.
  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: 32, background: docsConfig?.colors?.primary }}>
      <nav>
        {/* Example: Render navigation from docsConfig */}
        {docsConfig?.navigation && (
          <pre style={{ background: '#eee', padding: 8 }}>{JSON.stringify(docsConfig.navigation, null, 2)}</pre>
        )}
      </nav>
      <h1>{frontMatter.title}</h1>
      <p>{frontMatter.description}</p>
      <MDXContent />
    </main>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  if (!fs.existsSync(CONTENT_PATH)) {
    return { paths: [], fallback: false };
  }
  const files = fs.readdirSync(CONTENT_PATH).filter(f => f.endsWith('.mdx'));
  const paths = files.map(file => ({
    params: { slug: file.replace(/\.mdx$/, '') }
  }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const filePath = path.join(CONTENT_PATH, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    return { notFound: true };
  }
  const source = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(source);
  const mdxSource = path.relative(path.join(process.cwd(), 'src/pages/docs'), filePath);

  // Load docs config
  const docsConfig = loadDocsConfig();

  return {
    props: {
      frontMatter: data,
      mdxSource,
      docsConfig,
    }
  };
};
