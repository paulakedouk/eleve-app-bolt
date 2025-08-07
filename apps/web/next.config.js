/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eleve-native-app.s3.us-east-2.amazonaws.com',
        port: '',
        pathname: '/public/assets/images/**',
      },
    ],
  },
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['@shared/shared'],
  },
};

module.exports = nextConfig;
