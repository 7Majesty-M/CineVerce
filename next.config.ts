import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/**',
      },
      // Добавим на всякий случай Google, если у вас аватарки оттуда
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  
  // Добавляем управление кэшем
  async headers() {
    return [
      {
        // 1. Правило для всех страниц сайта: ЗАПРЕТИТЬ КЭШ
        // Это решит проблему, когда у друга открывается старая версия
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        // 2. Правило для системных файлов Next.js (скрипты, стили): РАЗРЕШИТЬ КЭШ
        // Это нужно, чтобы сайт грузился быстро и не скачивал движок React каждый раз заново
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // 3. Правило для картинок Next.js: РАЗРЕШИТЬ КЭШ
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
