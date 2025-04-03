/** @type {import('next').NextConfig} */
const { withExpo } = require('@expo/next-adapter');
const withPlugins = require('next-compose-plugins');
const withTM = require('next-transpile-modules')([
  'react-native-web',
  'react-native',
  'expo',
  '@react-native-async-storage/async-storage',
  '@react-navigation/native',
  '@react-navigation/native-stack',
  'react-native-chart-kit',
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-svg',
]);

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Ensure that Next.js handles non-standard file extensions used in React Native
  webpack: (config) => {
    config.resolve.extensions = [
      '.web.js',
      '.web.jsx',
      '.web.ts',
      '.web.tsx',
      ...config.resolve.extensions,
    ];
    return config;
  },
  // Redirect all requests to the main app
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/',
      },
    ];
  },
  // Optimize images
  images: {
    domains: ['example.com'], // Add domains for remote images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

module.exports = withPlugins(
  [
    withTM,
    [withExpo, { projectRoot: __dirname }],
  ],
  nextConfig
);
