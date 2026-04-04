import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Keep firebase-admin external so the Functions/SSR bundle does not try to webpack it incorrectly. */
  serverExternalPackages: ['firebase-admin'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.thingiverse.com' },
      { protocol: 'https', hostname: '**.printables.com' },
      { protocol: 'https', hostname: '**.myminifactory.com' },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
