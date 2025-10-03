import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    appIsrStatus: false,
  },

  // 图片优化配置
  images: {
    // 允许从 Supabase Storage 加载图片
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // 优先使用的图片格式（按优先级排序）
    formats: ['image/avif', 'image/webp'],
    // 预定义的设备尺寸（用于响应式图片）
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // 预定义的图片尺寸（用于小图标等）
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 浏览器缓存时间：30 天
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  // Configure webpack to ignore the external folder
  webpack: (config: any) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/Chinesename.club/**', '**/node_modules/**'],
    };
    return config;
  },
};

export default nextConfig;
