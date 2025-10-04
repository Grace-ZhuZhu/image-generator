/**
 * 检查图片缓存配置的工具函数
 * 用于验证 Supabase Storage 返回的 Cache-Control 头
 */

export async function checkImageCacheHeaders(imageUrl: string) {
  try {
    const response = await fetch(imageUrl, {
      method: 'HEAD', // 只获取响应头，不下载图片
    });

    const headers = {
      'cache-control': response.headers.get('cache-control'),
      'etag': response.headers.get('etag'),
      'last-modified': response.headers.get('last-modified'),
      'age': response.headers.get('age'),
      'expires': response.headers.get('expires'),
    };

    console.log('=== Image Cache Headers ===');
    console.log('URL:', imageUrl);
    console.log('Status:', response.status);
    console.log('Headers:', headers);
    console.log('===========================');

    return headers;
  } catch (error) {
    console.error('Failed to check cache headers:', error);
    return null;
  }
}

/**
 * 分析缓存配置是否正确
 */
export function analyzeCacheConfig(headers: Record<string, string | null>) {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // 检查 Cache-Control
  const cacheControl = headers['cache-control'];
  if (!cacheControl) {
    issues.push('❌ 缺少 Cache-Control 头');
    recommendations.push('添加 Cache-Control: public, max-age=31536000, immutable');
  } else {
    console.log('✅ Cache-Control:', cacheControl);
    
    if (!cacheControl.includes('public')) {
      issues.push('⚠️ Cache-Control 缺少 public 指令');
    }
    
    if (!cacheControl.includes('max-age')) {
      issues.push('⚠️ Cache-Control 缺少 max-age 指令');
    } else {
      const maxAge = cacheControl.match(/max-age=(\d+)/)?.[1];
      if (maxAge && parseInt(maxAge) < 86400) {
        issues.push(`⚠️ max-age 太短: ${maxAge}秒 (建议 31536000 = 1年)`);
      }
    }
    
    if (!cacheControl.includes('immutable')) {
      recommendations.push('建议添加 immutable 指令（避免刷新时重新验证）');
    }
  }

  // 检查 ETag
  if (headers['etag']) {
    console.log('✅ ETag:', headers['etag']);
  } else {
    issues.push('⚠️ 缺少 ETag（无法进行条件请求）');
  }

  // 检查 Last-Modified
  if (headers['last-modified']) {
    console.log('✅ Last-Modified:', headers['last-modified']);
  } else {
    issues.push('⚠️ 缺少 Last-Modified（无法进行条件请求）');
  }

  return { issues, recommendations };
}

