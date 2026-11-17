const nextConfig = {
  distDir: process.env.NEXT_DEV_DIST_DIR || ".next",
  experimental: {
    agentUpgrade: "security",
  },
  allowedDevOrigins: [
    "dolls-dental-amended-faq.trycloudflare.com",
    "*.trycloudflare.com",
    "192.168.40.11:3000",
    "192.168.40.11",
    "localhost:3000",
    "localhost",
  ],
  async redirects() {
    return [
      {
        source: "/motor-legal",
        destination: "/sorteo-en-vivo",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/audio/:file*.m4a",
        headers: [
          { key: "Content-Type", value: "audio/mp4" },
          { key: "Accept-Ranges", value: "bytes" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/sorteo-en-vivo",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
};

export default nextConfig;
