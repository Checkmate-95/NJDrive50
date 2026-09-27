/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    tsconfigPath: "tsconfig.json",
  },

  // Static pages in public/ are only served at their exact file path
  // (e.g. /delete-data/index.html). These rewrites keep the clean URLs
  // (/delete-data, /delete-account) working, including any URL registered
  // in Google Play Console. Trailing-slash variants are redirected to these
  // paths by Next.js automatically.
  async rewrites() {
    return [
      { source: "/delete-data", destination: "/delete-data/index.html" },
      { source: "/delete-account", destination: "/delete-account/index.html" },
    ]
  },
}

export default nextConfig