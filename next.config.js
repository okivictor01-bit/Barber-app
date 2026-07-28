/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // required for Cloudflare Pages
  },
};

module.exports = nextConfig;
