/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['firebase-admin'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.googleapis.com https://*.googleusercontent.com https://cdn.thingiverse.com https://cdn.myminifactory.com https://firebasestorage.googleapis.com",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },

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
