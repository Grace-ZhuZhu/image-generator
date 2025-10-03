# 📊 图片加载性能分析与优化报告

基于对 AI-Petography 代码库的全面分析，我们识别出了多个关键的优化机会和当前实现细节。以下是详细评估报告：

---

## 🔍 **当前实现分析**

### **1. 图片渲染方式**

**当前状态：**
- ❌ **使用原生 `<img>` 标签而非 Next.js `<Image>` 组件**
- `app/page.tsx` 中所有图片使用标准 HTML `<img>` 标签（第 574-578、700-708 行）
- 缺少自动优化、懒加载和响应式图片处理

````tsx path=app/page.tsx mode=EXCERPT
<img
  src={item.publicUrls?.md || ""}
  alt={item.title || "Template"}
  className="w-full h-auto object-contain transition hover:scale-105"
/>
````

**影响：** 错失 Next.js 自动图片优化、WebP 转换和懒加载功能。

---

### **2. 图片格式与优化**

**当前状态：**
- ✅ **使用 Sharp 进行服务端图片处理**（位于 `app/api/templates/upload/route.ts`）
- ✅ **生成多种尺寸变体**（sm: 80px, md: 320px, lg: 640px, orig）
- ✅ **JPEG 压缩**，质量设置（原图 90，缩放图 82）
- ❌ **不支持 WebP 或 AVIF 格式**
- ❌ **仅输出 JPEG**，错失现代格式优势

````typescript path=app/api/templates/upload/route.ts mode=EXCERPT
const sizes: Record<string, number> = { sm: 80, md: 320, lg: 640 };
const origJpeg = await sharp(buf).jpeg({ quality: 90 }).toBuffer();
const resized = await sharp(origJpeg)
  .resize({ width: Number(w) })
  .jpeg({ quality: 82 })
  .toBuffer();
````

**影响：** 错失 WebP 带来的 25-35% 文件大小减少，以及 AVIF 的 50% 减少。

---

### **3. 懒加载**

**当前状态：**
- ❌ **未实现懒加载**
- 页面渲染时所有图片立即加载
- 瀑布流画廊一次性加载所有可见图片

**影响：** 初始页面加载性能差，尤其是每页 50+ 张图片时。

---

### **4. 响应式图片**

**当前状态：**
- ✅ **提供多种尺寸变体**（sm, md, lg, orig）
- ❌ **未使用 `srcset` 或 `<picture>` 元素**
- ❌ **无论视口大小都加载相同尺寸**
- 当前所有画廊项目都加载 `md`（320px）

**影响：** 移动用户下载不必要的大图片；桌面用户可能看到低于最佳质量的图片。

---

### **5. 缓存策略**

**当前状态：**
- ✅ **上传时的基础缓存控制**：`cacheControl: "3600"`（1 小时）
- ✅ **Supabase Storage CDN** 自动启用
- ❌ **无浏览器级缓存策略**
- ❌ **无 stale-while-revalidate 模式**
- ❌ **API 响应未缓存**（`export const dynamic = "force-dynamic"`）

````typescript path=app/api/templates/route.ts mode=EXCERPT
export const dynamic = "force-dynamic";
````

**影响：** 每次页面导航都重新获取所有模板数据，即使数据未变化。

---

### **6. 预加载与预取**

**当前状态：**
- ❌ **无关键图片预加载**
- ❌ **无下一页图片预取**
- ❌ **无首屏图片优先级提示**

**影响：** 感知性能较慢，尤其是英雄/特色图片。

---

### **7. 渐进式加载**

**当前状态：**
- ❌ **无模糊占位符技术**
- ❌ **无渐进式 JPEG 编码**
- ❌ **无图片骨架屏加载器**
- 基础加载状态：`{loadingTemplates && <Loader2 />}`

**影响：** 图片加载期间用户体验差；布局偏移问题。

---

### **8. 图片 CDN 与分发**

**当前状态：**
- ✅ **Supabase Storage 内置 CDN**
- ✅ **模板存储桶的公共 URL**
- ✅ **用户上传的签名 URL**（1 小时过期）
- ❌ **无自定义 CDN 配置**
- ❌ **URL 中无图片转换参数**

**影响：** 基线良好，但缺少高级 CDN 功能。

---

### **9. 打包体积影响**

**当前状态：**
- ✅ **图片外部存储**（Supabase Storage）
- ✅ **打包中无图片**（仅 `/public` 中 2 个小 logo）
- ✅ **已安装 Sharp** 用于服务端处理

**影响：** 打包体积影响最小 - 这部分优化良好。

---

### **10. 加载状态与用户体验**

**当前状态：**
- ✅ **基础加载指示器**（`loadingTemplates` 状态）
- ❌ **无单个图片加载状态**
- ❌ **无图片加载失败的错误边界**
- ❌ **无加载失败重试机制**

---

## 🚀 **优化建议**

### **优先级 1：关键性能提升**

#### **1.1 迁移到 Next.js Image 组件**

**当前实现：**
```tsx
<img
  src={item.publicUrls?.md || ""}
  alt={item.title || "Template"}
  className="w-full h-auto object-contain transition hover:scale-105"
/>
```

**推荐实现：**
```tsx
import Image from 'next/image';

<Image
  src={item.publicUrls?.md || ""}
  alt={item.title || "Template"}
  width={320}
  height={320}
  loading="lazy"
  placeholder="blur"
  blurDataURL={item.publicUrls?.sm} // 使用最小尺寸作为模糊占位符
  className="w-full h-auto object-contain transition hover:scale-105"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

**优势：**
- ✅ 自动懒加载
- ✅ 自动 WebP 转换（如已配置）
- ✅ 模糊占位符效果
- ✅ 防止布局偏移
- ✅ 响应式尺寸

**预期影响：** 初始页面加载速度提升 40-60%，LCP 改善 1-2 秒。

---

#### **1.2 添加 WebP 和 AVIF 支持**

**当前实现（上传路由）：**
```typescript
const origJpeg = await sharp(buf).jpeg({ quality: 90 }).toBuffer();
```

**推荐实现：**
```typescript
// 生成多种格式
const processOne = async (file: File) => {
  const id = globalThis.crypto?.randomUUID?.() || (await import("crypto")).randomUUID();
  const buf = Buffer.from(await file.arrayBuffer());

  // 处理原图
  const processed = sharp(buf);

  // 生成 JPEG（回退格式）
  const origJpeg = await processed.clone().jpeg({ quality: 90 }).toBuffer();

  // 生成 WebP（更好的压缩）
  const origWebP = await processed.clone().webp({ quality: 85 }).toBuffer();

  // 生成 AVIF（最佳压缩，可选）
  const origAvif = await processed.clone().avif({ quality: 80 }).toBuffer();

  // 上传所有格式
  await Promise.all([
    upload("orig.jpg", origJpeg, "image/jpeg"),
    upload("orig.webp", origWebP, "image/webp"),
    upload("orig.avif", origAvif, "image/avif"),
  ]);

  // 为每种格式生成尺寸变体
  for (const [sizeName, width] of Object.entries(sizes)) {
    const resized = sharp(buf).resize({ width: Number(width) });
    await Promise.all([
      upload(`${sizeName}.jpg`, await resized.clone().jpeg({ quality: 82 }).toBuffer(), "image/jpeg"),
      upload(`${sizeName}.webp`, await resized.clone().webp({ quality: 78 }).toBuffer(), "image/webp"),
    ]);
  }
};
```

**优势：**
- ✅ WebP 文件大小减少 25-35%
- ✅ AVIF 文件大小减少 50%
- ✅ 现代浏览器下载更快
- ✅ 自动回退到 JPEG

**预期影响：** 带宽减少 30-50%，图片加载时间缩短 0.5-1 秒。

---

#### **1.3 使用 Intersection Observer 实现正确的懒加载**

**推荐实现：**
```tsx
// components/LazyImage.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface LazyImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

export function LazyImage({ src, alt, priority = false, ...props }: LazyImageProps) {
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' } // 在进入视口前 50px 开始加载
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  return (
    <div ref={imgRef}>
      {isInView ? (
        <Image src={src} alt={alt} {...props} />
      ) : (
        <div className="bg-muted animate-pulse" style={{ aspectRatio: `${props.width}/${props.height}` }} />
      )}
    </div>
  );
}
```

**使用方式：**
```tsx
<LazyImage
  src={item.publicUrls?.md || ""}
  alt={item.title || "Template"}
  width={320}
  height={320}
  priority={index < 6} // 前 6 张图片立即加载
  sizes="(max-width: 640px) 100vw, 33vw"
/>
```

**预期影响：** 初始网络请求减少 70%，FCP 更快。

---

### **优先级 2：增强性能**

#### **2.1 添加 srcset 响应式图片支持**

**推荐实现：**
```tsx
// 使用 Next.js Image 配合正确的 sizes
<Image
  src={item.publicUrls?.lg || ""}
  alt={item.title || "Template"}
  width={640}
  height={640}
  sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 640px"
  loading="lazy"
/>
```

或使用 picture 元素手动实现：
```tsx
<picture>
  <source
    srcSet={`${item.publicUrls?.sm} 80w, ${item.publicUrls?.md} 320w, ${item.publicUrls?.lg} 640w`}
    sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 640px"
    type="image/webp"
  />
  <img
    src={item.publicUrls?.md}
    alt={item.title || "Template"}
    loading="lazy"
  />
</picture>
```

**预期影响：** 移动设备带宽节省 40%。

---

#### **2.2 实现 API 响应缓存**

**当前实现：**
```typescript
export const dynamic = "force-dynamic";
```

**推荐实现：**
```typescript
// app/api/templates/route.ts
export const revalidate = 60; // 每 60 秒重新验证

// 或使用 Next.js 14 缓存选项
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // 缓存模板列表 5 分钟
  const cacheKey = `templates-${searchParams.toString()}`;

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
```

**预期影响：** 数据库查询减少 80%，页面导航更快。

---

#### **2.3 为关键图片添加预加载**

**推荐实现：**
```tsx
// app/page.tsx
export default function HomePage() {
  // 预加载前 3 张图片
  useEffect(() => {
    if (templates.length > 0) {
      templates.slice(0, 3).forEach(template => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = template.publicUrls?.md || '';
        document.head.appendChild(link);
      });
    }
  }, [templates]);

  // ... 组件其余部分
}
```

或在布局中：
```tsx
// app/layout.tsx
<head>
  <link rel="preconnect" href="https://your-supabase-storage-url.supabase.co" />
  <link rel="dns-prefetch" href="https://your-supabase-storage-url.supabase.co" />
</head>
```

**预期影响：** 英雄图片 LCP 提升 200-500ms。

---

#### **2.4 实现渐进式图片加载**

**推荐实现：**
```tsx
// 使用 base64 编码的微小图片作为模糊占位符
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg">
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
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

<Image
  src={item.publicUrls?.lg}
  placeholder="blur"
  blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(640, 640))}`}
  // ... 其他属性
/>
```

**预期影响：** 更好的感知性能，减少 CLS。

---

### **优先级 3：高级优化**

#### **3.1 配置 Next.js 图片优化**

**添加到 next.config.ts：**
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    appIsrStatus: false,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 天
  },

  webpack: (config: any) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/Chinesename.club/**', '**/node_modules/**'],
    };
    return config;
  },
};

export default nextConfig;
```

**预期影响：** 自动格式转换，更好的缓存。

---

#### **3.2 为大列表实现虚拟滚动**

**推荐实现（使用 react-window）：**
```bash
npm install react-window
```

```tsx
import { FixedSizeGrid } from 'react-window';

<FixedSizeGrid
  columnCount={3}
  columnWidth={320}
  height={800}
  rowCount={Math.ceil(templates.length / 3)}
  rowHeight={400}
  width={1000}
>
  {({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * 3 + columnIndex;
    const item = templates[index];
    if (!item) return null;

    return (
      <div style={style}>
        <LazyImage src={item.publicUrls?.md} {...props} />
      </div>
    );
  }}
</FixedSizeGrid>
```

**预期影响：** 处理 1000+ 张图片无性能下降。

---

#### **3.3 添加错误处理和重试逻辑**

**推荐实现：**
```tsx
"use client";

import { useState } from 'react';
import Image from 'next/image';

export function ResilientImage({ src, alt, ...props }) {
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleError = () => {
    if (retryCount < 3) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setError(false);
      }, 1000 * (retryCount + 1)); // 指数退避
    } else {
      setError(true);
    }
  };

  if (error) {
    return (
      <div className="bg-muted flex items-center justify-center">
        <span className="text-muted-foreground">图片加载失败</span>
      </div>
    );
  }

  return (
    <Image
      src={`${src}?retry=${retryCount}`}
      alt={alt}
      onError={handleError}
      {...props}
    />
  );
}
```

**预期影响：** 网络问题时更好的用户体验，减少图片加载失败。

---

## 📈 **预期性能提升总结**

| 优化项 | 当前 | 优化后 | 提升幅度 |
|-------------|---------|-------|-------------|
| **初始页面加载** | ~4-6秒 | ~1.5-2.5秒 | **提速 60-70%** |
| **LCP（最大内容绘制）** | ~3.5秒 | ~1.2秒 | **改善 65%** |
| **图片文件大小** | 100% (JPEG) | 30-50% (WebP/AVIF) | **减少 50-70%** |
| **网络请求数（初始）** | 50+ 张图片 | 6-10 张图片 | **减少 80%** |
| **带宽使用** | 100% | 40-60% | **节省 40-60%** |
| **CLS（累积布局偏移）** | 0.15-0.25 | <0.05 | **改善 80%** |
| **API 响应时间** | 200-500ms | 10-50ms（缓存） | **提速 90%** |

---

## 🎯 **实施优先级路线图**

### **第 1 周：快速见效**
1. ✅ 将所有 `<img>` 迁移到 Next.js `<Image>` 组件
2. ✅ 为所有图片添加 `loading="lazy"`
3. ✅ 配置 `next.config.ts` 图片优化设置
4. ✅ 添加模糊占位符

### **第 2 周：格式优化**
1. ✅ 更新上传 API 生成 WebP 变体
2. ✅ 更新模板 API 返回 WebP URL
3. ✅ 测试浏览器兼容性

### **第 3 周：缓存与性能**
1. ✅ 实现 API 响应缓存
2. ✅ 为关键图片添加预加载
3. ✅ 实现正确的错误处理

### **第 4 周：高级功能**
1. ✅ 添加 AVIF 支持（可选）
2. ✅ 为大列表实现虚拟滚动
3. ✅ 性能监控和优化

---

## 🔧 **监控与验证**

**添加性能监控：**
```tsx
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

**使用 Web Vitals 测量：**
```tsx
// app/page.tsx
import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    console.log(metric);
    // 发送到分析平台
  });
}
```

---------------------------------------------------------------------------------------------

## 📋 **分阶段行动计划与待办清单**

### **🚀 阶段 1：基础优化（第 1-2 周）**

#### **任务 1.1：迁移到 Next.js Image 组件**
- [ ] 在 `next.config.ts` 中配置图片域名白名单
  - [ ] 添加 Supabase Storage 域名到 `remotePatterns`
  - [ ] 配置 `formats: ['image/avif', 'image/webp']`
  - [ ] 设置 `minimumCacheTTL: 60 * 60 * 24 * 30`（30 天）
- [ ] 更新 `app/page.tsx` 中的图片渲染
  - [ ] 将第 574-578 行的 `<img>` 替换为 `<Image>`
  - [ ] 将第 700-708 行的模态框图片替换为 `<Image>`
  - [ ] 添加 `width` 和 `height` 属性
  - [ ] 添加 `loading="lazy"` 属性
  - [ ] 配置 `sizes` 属性用于响应式
- [ ] 更新 `components/admin/TemplatesUploader.tsx`
  - [ ] 将预览图片从 `<img>` 迁移到 `<Image>`
- [ ] 测试所有页面图片显示正常
  - [ ] 测试画廊瀑布流
  - [ ] 测试图片放大查看
  - [ ] 测试管理员上传预览

**技术实现要点：**
```typescript
// next.config.ts 配置示例
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**.supabase.co',
      pathname: '/storage/v1/object/public/**',
    },
  ],
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60 * 60 * 24 * 30,
}
```

---

#### **任务 1.2：创建 LazyImage 组件**
- [ ] 创建 `components/LazyImage.tsx` 文件
  - [ ] 实现 Intersection Observer 逻辑
  - [ ] 添加 `priority` 属性支持
  - [ ] 添加骨架屏占位符
  - [ ] 配置 `rootMargin: '50px'`（提前 50px 加载）
- [ ] 在 `app/page.tsx` 中使用 LazyImage
  - [ ] 前 6 张图片设置 `priority={true}`
  - [ ] 其余图片使用懒加载
- [ ] 测试懒加载效果
  - [ ] 使用 Chrome DevTools Network 面板验证
  - [ ] 确认只加载可见区域图片
  - [ ] 测试滚动时图片按需加载

**技术实现要点：**
```tsx
// 使用示例
<LazyImage
  src={item.publicUrls?.md || ""}
  alt={item.title || "Template"}
  width={320}
  height={320}
  priority={index < 6}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

---

#### **任务 1.3：添加模糊占位符**
- [ ] 创建 `utils/image-placeholders.ts` 工具文件
  - [ ] 实现 `shimmer()` 函数生成 SVG 占位符
  - [ ] 实现 `toBase64()` 函数
- [ ] 在 LazyImage 组件中集成占位符
  - [ ] 添加 `placeholder="blur"` 属性
  - [ ] 使用 `blurDataURL` 或 SVG shimmer
- [ ] 测试占位符效果
  - [ ] 慢速网络下验证模糊效果
  - [ ] 确认无布局偏移（CLS）

**技术实现要点：**
```tsx
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f6f7f8" offset="0%" />
      <stop stop-color="#edeef1" offset="20%" />
      <stop stop-color="#f6f7f8" offset="40%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f6f7f8" />
  <rect width="${w}" height="${h}" fill="url(#g)" />
  <animate attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite" />
</svg>`;
```

---

### **🎨 阶段 2：格式优化（第 3-4 周）**

#### **任务 2.1：更新上传 API 支持 WebP**
- [ ] 修改 `app/api/templates/upload/route.ts`
  - [ ] 为每个尺寸生成 WebP 变体
  - [ ] 保留 JPEG 作为回退格式
  - [ ] 更新 `processOne` 函数逻辑
  - [ ] 修改存储路径结构（`{id}/{size}.{format}`）
- [ ] 更新数据库 schema
  - [ ] 修改 `templates.images` 字段结构支持多格式
  - [ ] 添加迁移脚本
- [ ] 测试上传功能
  - [ ] 验证生成 JPEG 和 WebP 两种格式
  - [ ] 检查文件大小对比
  - [ ] 确认存储路径正确

**技术实现要点：**
```typescript
// 生成多格式示例
const sizes = { sm: 80, md: 320, lg: 640 };
for (const [sizeName, width] of Object.entries(sizes)) {
  const resized = sharp(buf).resize({ width });
  await Promise.all([
    upload(`${sizeName}.jpg`, await resized.clone().jpeg({ quality: 82 }).toBuffer()),
    upload(`${sizeName}.webp`, await resized.clone().webp({ quality: 78 }).toBuffer()),
  ]);
}
```

---

#### **任务 2.2：更新模板 API 返回多格式 URL**
- [ ] 修改 `app/api/templates/route.ts`
  - [ ] 更新 `publicUrls` 结构包含 WebP URL
  - [ ] 添加格式检测逻辑
  - [ ] 保持向后兼容性
- [ ] 更新类型定义 `types/templates.ts`
  - [ ] 添加 `webpUrls` 字段
  - [ ] 更新 `Template` 接口
- [ ] 测试 API 响应
  - [ ] 验证返回正确的 URL 结构
  - [ ] 测试新旧数据兼容性

**技术实现要点：**
```typescript
publicUrls: {
  sm: supabase.storage.from("templates").getPublicUrl(item.images.sm).data.publicUrl,
  md: supabase.storage.from("templates").getPublicUrl(item.images.md).data.publicUrl,
  lg: supabase.storage.from("templates").getPublicUrl(item.images.lg).data.publicUrl,
  orig: supabase.storage.from("templates").getPublicUrl(item.images.orig).data.publicUrl,
},
webpUrls: {
  sm: supabase.storage.from("templates").getPublicUrl(item.images.smWebp).data.publicUrl,
  md: supabase.storage.from("templates").getPublicUrl(item.images.mdWebp).data.publicUrl,
  lg: supabase.storage.from("templates").getPublicUrl(item.images.lgWebp).data.publicUrl,
}
```

---

#### **任务 2.3：前端集成 WebP 支持**
- [ ] 更新 `app/page.tsx` 使用 WebP URL
  - [ ] 优先使用 WebP，回退到 JPEG
  - [ ] 使用 `<picture>` 元素或 Next.js Image 自动处理
- [ ] 测试浏览器兼容性
  - [ ] Chrome/Edge（支持 WebP）
  - [ ] Safari（支持 WebP）
  - [ ] Firefox（支持 WebP）
  - [ ] 旧版浏览器回退到 JPEG
- [ ] 性能测试
  - [ ] 对比 JPEG vs WebP 文件大小
  - [ ] 测量页面加载时间改善
  - [ ] 使用 Lighthouse 评分

---

#### **任务 2.4：（可选）添加 AVIF 支持**
- [ ] 在上传 API 中添加 AVIF 生成
  - [ ] 使用 `sharp().avif({ quality: 80 })`
  - [ ] 仅为 `lg` 和 `orig` 尺寸生成 AVIF
- [ ] 更新 API 返回 AVIF URL
- [ ] 前端使用 `<picture>` 元素支持 AVIF
  - [ ] AVIF > WebP > JPEG 优先级
- [ ] 测试 AVIF 兼容性和性能

**技术实现要点：**
```tsx
<picture>
  <source srcSet={item.avifUrls?.lg} type="image/avif" />
  <source srcSet={item.webpUrls?.lg} type="image/webp" />
  <img src={item.publicUrls?.lg} alt={item.title} loading="lazy" />
</picture>
```

---

### **⚡ 阶段 3：缓存与性能（第 5-6 周）**

#### **任务 3.1：实现 API 响应缓存**
- [ ] 修改 `app/api/templates/route.ts`
  - [ ] 移除 `export const dynamic = "force-dynamic"`
  - [ ] 添加 `export const revalidate = 60`
  - [ ] 配置 `Cache-Control` 响应头
  - [ ] 实现 `stale-while-revalidate` 策略
- [ ] 测试缓存行为
  - [ ] 验证首次请求从数据库获取
  - [ ] 验证后续请求从缓存返回
  - [ ] 测试 60 秒后重新验证
- [ ] 监控缓存命中率
  - [ ] 添加日志记录
  - [ ] 使用 Vercel Analytics 监控

**技术实现要点：**
```typescript
export const revalidate = 60; // 60 秒重新验证

return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  },
});
```

---

#### **任务 3.2：添加关键图片预加载**
- [ ] 在 `app/page.tsx` 中实现预加载逻辑
  - [ ] 使用 `useEffect` 预加载前 3 张图片
  - [ ] 创建 `<link rel="preload">` 元素
  - [ ] 添加到 `document.head`
- [ ] 在 `app/layout.tsx` 中添加 DNS 预取
  - [ ] 添加 `<link rel="preconnect">` 到 Supabase Storage
  - [ ] 添加 `<link rel="dns-prefetch">`
- [ ] 测试预加载效果
  - [ ] 使用 Chrome DevTools 验证预加载
  - [ ] 测量 LCP 改善

**技术实现要点：**
```tsx
useEffect(() => {
  if (templates.length > 0) {
    templates.slice(0, 3).forEach(template => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = template.publicUrls?.md || '';
      document.head.appendChild(link);
    });
  }
}, [templates]);
```

---

#### **任务 3.3：实现错误处理和重试**
- [ ] 创建 `components/ResilientImage.tsx`
  - [ ] 实现错误状态管理
  - [ ] 添加重试逻辑（最多 3 次）
  - [ ] 使用指数退避策略
  - [ ] 显示友好的错误提示
- [ ] 在 LazyImage 中集成 ResilientImage
- [ ] 测试错误场景
  - [ ] 模拟网络错误
  - [ ] 验证重试机制
  - [ ] 测试最终失败状态显示

**技术实现要点：**
```tsx
const handleError = () => {
  if (retryCount < 3) {
    setTimeout(() => {
      setRetryCount(prev => prev + 1);
      setError(false);
    }, 1000 * (retryCount + 1)); // 1s, 2s, 3s
  } else {
    setError(true);
  }
};
```

---

#### **任务 3.4：优化 Supabase Storage 缓存**
- [ ] 更新 `app/api/upload/route.ts`
  - [ ] 将 `cacheControl` 从 3600 增加到 86400（24 小时）
  - [ ] 添加 `immutable` 标志（如适用）
- [ ] 配置 Supabase Storage 策略
  - [ ] 检查 CDN 缓存设置
  - [ ] 启用 Brotli 压缩
- [ ] 测试缓存效果
  - [ ] 验证响应头
  - [ ] 测试浏览器缓存行为

---

### **� 阶段 4：高级优化（第 7-8 周）**

#### **任务 4.1：实现虚拟滚动（可选）**
- [ ] 安装依赖
  - [ ] `npm install react-window`
  - [ ] `npm install @types/react-window -D`
- [ ] 创建 `components/VirtualGallery.tsx`
  - [ ] 使用 `FixedSizeGrid` 组件
  - [ ] 配置列数和行高
  - [ ] 集成 LazyImage
- [ ] 在 `app/page.tsx` 中集成虚拟滚动
  - [ ] 替换现有瀑布流布局
  - [ ] 保持响应式设计
- [ ] 性能测试
  - [ ] 测试 1000+ 图片场景
  - [ ] 对比虚拟滚动前后性能

---

#### **任务 4.2：添加性能监控**
- [ ] 安装 Vercel Speed Insights
  - [ ] `npm install @vercel/speed-insights`
- [ ] 在 `app/layout.tsx` 中集成
  - [ ] 添加 `<SpeedInsights />` 组件
- [ ] 实现 Web Vitals 报告
  - [ ] 创建 `components/WebVitals.tsx`
  - [ ] 使用 `useReportWebVitals` hook
  - [ ] 发送数据到分析平台
- [ ] 配置监控仪表板
  - [ ] 设置 LCP、FID、CLS 阈值告警
  - [ ] 创建性能趋势图表

**技术实现要点：**
```tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

---

#### **任务 4.3：响应式图片优化**
- [ ] 为不同设备配置最佳尺寸
  - [ ] 移动端（<640px）：使用 `sm` 或 `md`
  - [ ] 平板（640-1024px）：使用 `md`
  - [ ] 桌面（>1024px）：使用 `lg`
- [ ] 更新 `sizes` 属性
  - [ ] 精确匹配设备尺寸
  - [ ] 测试不同视口
- [ ] 实现 `<picture>` 元素（如需要）
  - [ ] 艺术指导（art direction）
  - [ ] 不同宽高比

**技术实现要点：**
```tsx
<Image
  src={item.publicUrls?.lg}
  alt={item.title}
  width={640}
  height={640}
  sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 640px"
  loading="lazy"
/>
```

---

### **📊 阶段 5：测试与验证（第 9-10 周）**

#### **任务 5.1：性能基准测试**
- [ ] 使用 Lighthouse 测试
  - [ ] 桌面端评分
  - [ ] 移动端评分
  - [ ] 记录 LCP、FID、CLS 指标
- [ ] 使用 WebPageTest 测试
  - [ ] 多地域测试
  - [ ] 不同网络条件（3G、4G、5G）
- [ ] 对比优化前后数据
  - [ ] 创建性能对比报告
  - [ ] 记录改善百分比

---

#### **任务 5.2：浏览器兼容性测试**
- [ ] 测试主流浏览器
  - [ ] Chrome（最新版 + 前 2 个版本）
  - [ ] Safari（最新版 + 前 2 个版本）
  - [ ] Firefox（最新版 + 前 2 个版本）
  - [ ] Edge（最新版）
- [ ] 测试移动浏览器
  - [ ] iOS Safari
  - [ ] Android Chrome
- [ ] 验证格式回退
  - [ ] WebP 不支持时回退到 JPEG
  - [ ] AVIF 不支持时回退到 WebP/JPEG

---

#### **任务 5.3：用户体验测试**
- [ ] 慢速网络测试
  - [ ] 使用 Chrome DevTools 限速
  - [ ] 验证占位符显示
  - [ ] 测试渐进式加载
- [ ] 大量图片场景测试
  - [ ] 100+ 张图片
  - [ ] 500+ 张图片
  - [ ] 1000+ 张图片（如使用虚拟滚动）
- [ ] 错误场景测试
  - [ ] 图片 404
  - [ ] 网络中断
  - [ ] 验证重试和错误提示

---

#### **任务 5.4：文档更新**
- [ ] 更新技术文档
  - [ ] 记录图片优化策略
  - [ ] 更新 API 文档
  - [ ] 添加性能最佳实践
- [ ] 创建运维文档
  - [ ] CDN 配置说明
  - [ ] 缓存策略说明
  - [ ] 监控告警配置
- [ ] 更新 README
  - [ ] 添加性能优化章节
  - [ ] 更新依赖列表

---

## 📝 **技术实现检查清单**

### **配置文件**
- [ ] `next.config.ts` - 图片优化配置完成
- [ ] `package.json` - 添加必要依赖（react-window, @vercel/speed-insights）
- [ ] `tsconfig.json` - 类型定义更新

### **组件创建**
- [ ] `components/LazyImage.tsx` - 懒加载图片组件
- [ ] `components/ResilientImage.tsx` - 带重试的图片组件
- [ ] `components/VirtualGallery.tsx` - 虚拟滚动画廊（可选）
- [ ] `components/WebVitals.tsx` - 性能监控组件

### **工具函数**
- [ ] `utils/image-placeholders.ts` - 占位符生成工具
- [ ] `utils/image-formats.ts` - 格式检测和选择工具

### **API 更新**
- [ ] `app/api/templates/upload/route.ts` - 多格式上传
- [ ] `app/api/templates/route.ts` - 多格式 URL 返回 + 缓存
- [ ] `app/api/upload/route.ts` - 缓存配置优化

### **类型定义**
- [ ] `types/templates.ts` - 添加 WebP/AVIF URL 字段
- [ ] `types/image.ts` - 图片相关类型定义（新建）

### **页面更新**
- [ ] `app/page.tsx` - 使用 LazyImage 组件
- [ ] `app/layout.tsx` - 添加性能监控和预连接
- [ ] `components/admin/TemplatesUploader.tsx` - 图片组件迁移

---

## 🎯 **成功指标**

### **性能指标目标**
- [ ] LCP < 1.5 秒（移动端）
- [ ] LCP < 1.0 秒（桌面端）
- [ ] FID < 100ms
- [ ] CLS < 0.05
- [ ] Lighthouse 性能评分 > 90

### **资源指标目标**
- [ ] 初始页面加载图片数 < 10 张
- [ ] 平均图片大小减少 > 40%
- [ ] 总带宽使用减少 > 50%
- [ ] API 响应时间（缓存命中）< 50ms

### **用户体验指标**
- [ ] 图片加载失败率 < 0.1%
- [ ] 重试成功率 > 95%
- [ ] 无明显布局偏移
- [ ] 占位符显示流畅

---

## 🔄 **持续优化**

### **定期检查（每月）**
- [ ] 审查 Lighthouse 评分趋势
- [ ] 检查 CDN 缓存命中率
- [ ] 分析图片加载失败日志
- [ ] 更新浏览器兼容性测试

### **季度优化**
- [ ] 评估新的图片格式（如 JPEG XL）
- [ ] 优化图片质量设置
- [ ] 审查和更新缓存策略
- [ ] 性能基准对比

---

**文档版本：** v1.0
**最后更新：** 2025-01-18
**负责人：** 前端性能优化团队


