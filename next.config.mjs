
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ["lucide-react"],
  // Remove any i18n configuration
}

export default nextConfig;
