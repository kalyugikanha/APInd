/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Gateway URLs are published with a trailing slash (e.g. /ifsc-verification/v1/).
  // Serve them directly instead of 308-redirecting, since many HTTP clients drop POST bodies on redirect.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
