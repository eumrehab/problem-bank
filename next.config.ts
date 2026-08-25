import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = isGitHubPages
  ? {
      output: 'export',
      basePath: '/problem-bank',
      assetPrefix: '/problem-bank/',
      trailingSlash: true,
    }
  : {};

export default nextConfig;
