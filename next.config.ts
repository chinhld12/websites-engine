import withMDX from '@next/mdx';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
};

export default withMDX({
  extension: /\.mdx?$/,
  options: {
    // Add remark/rehype plugins here if needed
  }
})(nextConfig);
