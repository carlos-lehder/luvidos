import type { NextConfig } from "next";

const azureAccount = process.env.AZURE_STORAGE_ACCOUNT_NAME;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: azureAccount
          ? `${azureAccount}.blob.core.windows.net`
          : "*.blob.core.windows.net",
      },
    ],
  },
};

export default nextConfig;
