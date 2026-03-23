/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@wms/db', '@wms/types'],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
