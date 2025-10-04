/**
 * 图片 URL 辅助工具
 * 用于处理新旧两种图片 URL 格式，优先使用 WebP，回退到 JPEG
 */

import type { TemplatePublicUrls } from '@/types/templates';

/**
 * 获取图片 URL（优先 WebP，回退到 JPEG）
 * 支持新旧两种数据格式
 * 
 * @param urls - 图片 URL 对象
 * @param size - 图片尺寸 (sm, md, lg, orig)
 * @param preferWebP - 是否优先使用 WebP（默认 true）
 * @returns 图片 URL 字符串
 */
export function getImageUrl(
  urls: TemplatePublicUrls | undefined,
  size: 'sm' | 'md' | 'lg' | 'orig',
  preferWebP: boolean = true
): string {
  if (!urls || !urls[size]) return '';
  
  const sizeUrls = urls[size];
  
  // 新格式：{ jpg: "url", webp: "url" }
  if (typeof sizeUrls === 'object' && 'jpg' in sizeUrls && 'webp' in sizeUrls) {
    // 检测浏览器是否支持 WebP
    const supportsWebP = typeof window !== 'undefined' && 
      document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
    
    // 优先使用 WebP（如果浏览器支持且用户偏好）
    if (preferWebP && supportsWebP && sizeUrls.webp) {
      return sizeUrls.webp;
    }
    
    // 回退到 JPEG
    return sizeUrls.jpg || sizeUrls.webp || '';
  }
  
  // 旧格式：直接是字符串（向后兼容）
  if (typeof sizeUrls === 'string') {
    return sizeUrls;
  }
  
  return '';
}

/**
 * 获取多个尺寸的回退 URL
 * 按优先级尝试多个尺寸，返回第一个可用的 URL
 * 
 * @param urls - 图片 URL 对象
 * @param sizes - 尺寸优先级列表
 * @param preferWebP - 是否优先使用 WebP（默认 true）
 * @returns 图片 URL 字符串
 */
export function getImageUrlWithFallback(
  urls: TemplatePublicUrls | undefined,
  sizes: Array<'sm' | 'md' | 'lg' | 'orig'>,
  preferWebP: boolean = true
): string {
  for (const size of sizes) {
    const url = getImageUrl(urls, size, preferWebP);
    if (url) return url;
  }
  return '';
}

/**
 * 获取 srcset 字符串（用于响应式图片）
 * 
 * @param urls - 图片 URL 对象
 * @param preferWebP - 是否优先使用 WebP（默认 true）
 * @returns srcset 字符串
 */
export function getImageSrcSet(
  urls: TemplatePublicUrls | undefined,
  preferWebP: boolean = true
): string {
  if (!urls) return '';
  
  const srcsetParts: string[] = [];
  
  // sm: 80w
  const smUrl = getImageUrl(urls, 'sm', preferWebP);
  if (smUrl) srcsetParts.push(`${smUrl} 80w`);
  
  // md: 320w
  const mdUrl = getImageUrl(urls, 'md', preferWebP);
  if (mdUrl) srcsetParts.push(`${mdUrl} 320w`);
  
  // lg: 640w
  const lgUrl = getImageUrl(urls, 'lg', preferWebP);
  if (lgUrl) srcsetParts.push(`${lgUrl} 640w`);
  
  return srcsetParts.join(', ');
}

/**
 * 检测浏览器是否支持 WebP
 * 使用缓存避免重复检测
 */
let webpSupport: boolean | null = null;

export function supportsWebP(): boolean {
  if (webpSupport !== null) return webpSupport;
  
  if (typeof window === 'undefined') {
    // SSR 环境，假设支持（现代浏览器都支持）
    return true;
  }
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const dataUrl = canvas.toDataURL('image/webp');
    webpSupport = dataUrl.indexOf('data:image/webp') === 0;
    return webpSupport;
  } catch {
    webpSupport = false;
    return false;
  }
}

