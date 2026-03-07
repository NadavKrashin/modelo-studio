import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.thingiverse.com' },
      { protocol: 'https', hostname: '**.printables.com' },
      { protocol: 'https', hostname: '**.myminifactory.com' },
    ],
  },
};

export default nextConfig;
