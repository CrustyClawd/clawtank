/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  transpilePackages: ['three'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
