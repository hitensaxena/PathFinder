/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        cardinal: false,
        'async_hooks': false, // Add fallback for async_hooks
      };
    }
    return config;
  },
};

module.exports = nextConfig;