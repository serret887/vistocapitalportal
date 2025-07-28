import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  serverExternalPackages: ['@supabase/supabase-js'],
  trailingSlash: false,
  skipTrailingSlashRedirect: true
};

export default nextConfig;
