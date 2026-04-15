/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Do not bundle firebase-admin into the server graph (Firebase Functions / SSR).
  serverExternalPackages: ['firebase-admin'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = config.externals ?? [];
      if (Array.isArray(externals)) {
        externals.push('firebase-admin');
      } else {
        config.externals = [externals, 'firebase-admin'];
      }
    }
    return config;
  },
  // Production builds use `next build --webpack` to avoid Turbopack + firebase-admin issues.
  // These aliases still help `next dev --turbopack` if you opt into Turbopack locally.
  turbopack: {
    resolveAlias: {
      'firebase-admin/app': 'firebase-admin/app',
      'firebase-admin/firestore': 'firebase-admin/firestore',
      'firebase-admin/auth': 'firebase-admin/auth',
    },
  },
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

module.exports = nextConfig;
