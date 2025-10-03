/**
 * 图片占位符工具函数
 * 用于生成模糊占位符和 shimmer 动画效果
 */

/**
 * 生成 shimmer 动画 SVG
 * @param w - 宽度
 * @param h - 高度
 * @returns SVG 字符串
 */
export const shimmer = (w: number, h: number): string => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f6f7f8" offset="0%" />
      <stop stop-color="#edeef1" offset="20%" />
      <stop stop-color="#f6f7f8" offset="40%" />
      <stop stop-color="#f6f7f8" offset="100%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f6f7f8" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" begin="0s" repeatCount="indefinite"  />
</svg>`;

/**
 * 将字符串转换为 Base64
 * @param str - 输入字符串
 * @returns Base64 编码的字符串
 */
export const toBase64 = (str: string): string =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

/**
 * 生成 shimmer 占位符的 data URL
 * @param w - 宽度
 * @param h - 高度
 * @returns data:image/svg+xml;base64,... 格式的 URL
 */
export const getShimmerDataURL = (w: number, h: number): string =>
  `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`;

/**
 * 生成简单的灰色占位符
 * @param w - 宽度
 * @param h - 高度
 * @returns data URL
 */
export const getGrayPlaceholder = (w: number, h: number): string => {
  const svg = `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="#f0f0f0" />
</svg>`;
  return `data:image/svg+xml;base64,${toBase64(svg)}`;
};

/**
 * 生成渐变占位符
 * @param w - 宽度
 * @param h - 高度
 * @returns data URL
 */
export const getGradientPlaceholder = (w: number, h: number): string => {
  const svg = `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f6f7f8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#edeef1;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#grad)" />
</svg>`;
  return `data:image/svg+xml;base64,${toBase64(svg)}`;
};

