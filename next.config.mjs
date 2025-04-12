
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Outputs a Single-Page Application (SPA)
  distDir: './dist', // Changes the build output directory to `./dist/`
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ["lucide-react"],
  i18n: {
    locales: ['en', 'ja'],
    defaultLocale: 'ja',
    localeDetection: true,
  },
}

export default nextConfig;
