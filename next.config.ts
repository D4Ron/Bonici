import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // The home directory happens to contain a package-lock.json; pin the root to this project.
  turbopack: { root: __dirname },
  outputFileTracingRoot: __dirname,
  experimental: {
    // Dish photos, CVs and tender documents are uploaded through server actions.
    serverActions: { bodySizeLimit: '12mb' },
  },
  // Old URLs that may be bookmarked or indexed.
  async redirects() {
    return [
      { source: '/restaurants-page', destination: '/restaurants', permanent: true },
      { source: '/reviews', destination: '/avis', permanent: true },
      { source: '/bon-plan', destination: '/bon-plan/appels-offre', permanent: true },
      { source: '/carriere', destination: '/carriere/candidature-spontanee', permanent: true },
      { source: '/privacy', destination: '/confidentialite', permanent: true },
      { source: '/manager/:path*', destination: '/admin', permanent: true },
    ];
  },
  sassOptions: {
    silenceDeprecations: ['legacy-js-api'],
  },
};

export default nextConfig;
