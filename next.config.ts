import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["@ffmpeg-installer/ffmpeg"],

  images: {
    // 允许从腾讯云 CDN 加载图片
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.zyg2024.top',
        port: '',
        pathname: '/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; img-src 'self' data: blob: https://*.githubusercontent.com https://cdn.zyg2024.top; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' https:; font-src 'self' data:; media-src 'self' blob: https://cdn.zyg2024.top; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;"
          }
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/video-proxy/:path*",
        destination: "https://cdn.zyg2024.top/:path*",
      },
    ];
  },
};

export default nextConfig;
