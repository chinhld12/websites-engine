import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  experimental: {
    mdxRs: false, // Use @next/mdx instead of experimental MDX support
    largePageDataBytes: 1024 * 1024,
  },
  images: {
    unoptimized: true,
  },
  staticPageGenerationTimeout: 120,
};

// next-remote-watch is a CLI tool and does not need to be imported or wrapped in next.config.ts
export default nextConfig;
