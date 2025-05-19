const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      const emptyModulePath = path.resolve(__dirname, './src/lib/empty-module.js');
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        cardinal: false,
        'async_hooks': false,
        'http2': false,
        'dns': false,
        'events': emptyModulePath,
        'node:events': emptyModulePath,
      };
    }
    return config;
  },
};

module.exports = nextConfig;