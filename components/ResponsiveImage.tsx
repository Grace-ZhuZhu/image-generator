"use client";

import { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
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
  maxRetries?: number; // 最大重试次数
  showErrorUI?: boolean; // 是否显示错误 UI（重试按钮）
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
 * - 自动重试机制（指数退避）
 * - 友好的错误提示和手动重试
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
  maxRetries = 3,
  showErrorUI = true,
}: ResponsiveImageProps) {
  const [isInView, setIsInView] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // 清理定时器
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

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
    setHasError(false);
    setIsRetrying(false);
    onLoadingComplete?.();
  };

  const handleError = () => {
    console.error(`[ResponsiveImage] Image load error: ${alt}, retry count: ${retryCount}`);

    // 如果还有重试次数，自动重试（指数退避）
    if (retryCount < maxRetries) {
      const delay = 1000 * Math.pow(2, retryCount); // 1s, 2s, 4s
      console.log(`[ResponsiveImage] Retrying in ${delay}ms...`);

      setIsRetrying(true);
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setIsRetrying(false);
      }, delay);
    } else {
      // 重试次数用尽，显示错误状态
      console.error(`[ResponsiveImage] Max retries (${maxRetries}) reached for: ${alt}`);
      setHasError(true);
      setIsLoaded(true); // 隐藏占位符
      onError?.();
    }
  };

  // 手动重试
  const handleManualRetry = () => {
    console.log(`[ResponsiveImage] Manual retry triggered for: ${alt}`);
    setHasError(false);
    setIsLoaded(false);
    setRetryCount(0);
    setIsRetrying(false);
    // 强制重新渲染图片
    setIsInView(false);
    setTimeout(() => setIsInView(true), 10);
  };

  return (
    <div ref={imgRef} className="relative w-full">
      {/* 占位符 - 加载中 */}
      {!isLoaded && !hasError && (
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

          {/* 重试中提示 */}
          {isRetrying && retryCount > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg px-3 py-2 shadow-sm">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  重试中 ({retryCount}/{maxRetries})
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 错误状态 - 显示友好的错误提示和重试按钮 */}
      {hasError && showErrorUI && (
        <div
          className="w-full flex flex-col items-center justify-center gap-2 bg-muted/50 rounded-lg p-4"
          style={{ aspectRatio: `${width} / ${height}` }}
        >
          <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground text-center">图片加载失败</p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualRetry}
            className="h-7 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            重试
          </Button>
        </div>
      )}

      {/* 错误状态 - 不显示 UI（静默失败） */}
      {hasError && !showErrorUI && (
        <div
          className="w-full bg-muted/30 rounded-lg"
          style={{ aspectRatio: `${width} / ${height}` }}
        />
      )}

      {/* 只有在进入视口时才渲染图片 */}
      {isInView && !hasError && (jpg || webp) && (
        <picture key={retryCount}>
          {/* WebP 格式（优先） */}
          {webp && <source srcSet={`${webp}?retry=${retryCount}`} type="image/webp" />}

          {/* JPEG 格式（回退） */}
          <img
            src={`${jpg}?retry=${retryCount}`}
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

