"use client";

import { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getShimmerDataURL } from "@/utils/image-placeholders";
import type { TemplatePublicUrls } from "@/types/templates";

interface ResponsiveImageProps {
  publicUrls: TemplatePublicUrls | undefined;
  size: 'sm' | 'md' | 'lg' | 'orig';
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  onLoadingComplete?: () => void;
  onError?: () => void;
  usePlaceholder?: boolean;
}

/**
 * ResponsiveImage 组件 - 使用 <picture> 元素支持 WebP 和 JPEG
 * 
 * 功能：
 * - 使用 <picture> 元素提供 WebP 和 JPEG 两种格式
 * - 浏览器自动选择支持的格式（WebP 优先）
 * - 支持新旧两种数据格式（向后兼容）
 * - Intersection Observer 懒加载
 * - 骨架屏占位符
 */
export default function ResponsiveImage({
  publicUrls,
  size,
  alt,
  width,
  height,
  priority = false,
  className = "",
  onLoadingComplete,
  onError,
  usePlaceholder = true,
}: ResponsiveImageProps) {
  const [isInView, setIsInView] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // 获取图片 URL（支持新旧格式）
  const getImageUrls = () => {
    if (!publicUrls || !publicUrls[size]) {
      return { webp: '', jpg: '' };
    }

    const sizeUrls = publicUrls[size];

    // 新格式：{ jpg: "url", webp: "url" }
    if (typeof sizeUrls === 'object' && 'jpg' in sizeUrls && 'webp' in sizeUrls) {
      return {
        webp: sizeUrls.webp || '',
        jpg: sizeUrls.jpg || '',
      };
    }

    // 旧格式：直接是字符串（只有 JPEG）
    if (typeof sizeUrls === 'string') {
      return {
        webp: '',
        jpg: sizeUrls,
      };
    }

    return { webp: '', jpg: '' };
  };

  const { webp, jpg } = getImageUrls();

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px",
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoadingComplete?.();
  };

  const handleError = () => {
    setIsLoaded(true);
    onError?.();
  };

  return (
    <div ref={imgRef} className="relative w-full">
      {/* 占位符 */}
      {!isLoaded && (
        <div
          className="w-full z-10"
          style={{ aspectRatio: `${width} / ${height}` }}
        >
          {usePlaceholder ? (
            <img
              src={getShimmerDataURL(width, height)}
              alt="Loading..."
              className="w-full h-full object-cover"
            />
          ) : (
            <Skeleton className="w-full h-full" />
          )}
        </div>
      )}

      {/* 只有在进入视口时才渲染图片 */}
      {isInView && (jpg || webp) && (
        <picture>
          {/* WebP 格式（优先） */}
          {webp && <source srcSet={webp} type="image/webp" />}

          {/* JPEG 格式（回退） */}
          <img
            src={jpg}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? "eager" : "lazy"}
            crossOrigin="anonymous"
            onLoad={handleLoad}
            onError={handleError}
            className={`${className} transition-opacity duration-300 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        </picture>
      )}
    </div>
  );
}

