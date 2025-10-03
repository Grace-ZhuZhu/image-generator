"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { getShimmerDataURL } from "@/utils/image-placeholders";

interface LazyImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
  onLoadingComplete?: () => void;
  onError?: () => void;
  usePlaceholder?: boolean; // 是否使用模糊占位符
}

/**
 * LazyImage 组件 - 带有 Intersection Observer 的懒加载图片组件
 *
 * 功能：
 * - 使用 Intersection Observer API 实现真正的懒加载
 * - 支持 priority 属性，优先加载重要图片
 * - 显示骨架屏占位符
 * - 提前 50px 开始加载（rootMargin）
 * - 淡入动画效果
 * - 模糊占位符支持（shimmer 动画）
 */
export default function LazyImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = "",
  sizes,
  onLoadingComplete,
  onError,
  usePlaceholder = true, // 默认使用模糊占位符
}: LazyImageProps) {
  const [isInView, setIsInView] = useState(priority); // priority 图片立即加载
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 如果是 priority 图片，跳过 Intersection Observer
    if (priority) {
      setIsInView(true);
      return;
    }

    // 创建 Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // 一旦进入视口，停止观察
            observer.disconnect();
          }
        });
      },
      {
        // 提前 50px 开始加载
        rootMargin: "50px",
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    // 清理函数
    return () => {
      observer.disconnect();
    };
  }, [priority]);

  const handleLoadingComplete = () => {
    setIsLoaded(true);
    onLoadingComplete?.();
  };

  const handleError = () => {
    setIsLoaded(true); // 即使错误也隐藏骨架屏
    onError?.();
  };

  return (
    <div ref={imgRef} className="relative w-full h-full">
      {/* 骨架屏占位符 - 在图片加载前显示（仅当不使用模糊占位符时） */}
      {!isLoaded && !usePlaceholder && (
        <Skeleton
          className="absolute inset-0 w-full h-full"
          style={{ aspectRatio: `${width} / ${height}` }}
        />
      )}

      {/* 只有在进入视口时才渲染 Image 组件 */}
      {isInView && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          priority={priority}
          sizes={sizes}
          placeholder={usePlaceholder ? "blur" : "empty"}
          blurDataURL={usePlaceholder ? getShimmerDataURL(width, height) : undefined}
          onLoadingComplete={handleLoadingComplete}
          onError={handleError}
          className={`${className} transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}

