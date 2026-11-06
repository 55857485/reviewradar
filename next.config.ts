import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    '/api/reports/generate': ['./certs/**/*'],
  },
};

export default nextConfig;
