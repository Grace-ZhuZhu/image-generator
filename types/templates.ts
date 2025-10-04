// 图片格式类型
export type ImageFormat = 'jpg' | 'webp';

// 单个尺寸的多格式路径
export interface ImagePaths {
  jpg: string;
  webp: string;
}

// 模板图片存储路径（数据库中的 images 字段）
export interface TemplateImages {
  sm: ImagePaths;
  md: ImagePaths;
  lg: ImagePaths;
  orig: ImagePaths;
}

// 模板图片公共 URL（API 返回给前端）
export interface TemplatePublicUrls {
  sm: ImagePaths;
  md: ImagePaths;
  lg: ImagePaths;
  orig: ImagePaths;
}

// New: Prompt interface for the normalized prompts table
// Note: title is NOT in prompts table - it's in templates table as image-level metadata
export interface Prompt {
  id: string;
  prompt: string;
  theme: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Updated: Template now references a prompt via prompt_id
// title field is kept here as it's image-level metadata (used for alt text)
export interface Template {
  id: string;
  prompt_id: string;
  title: string | null;  // Image-specific title for alt text
  images: TemplateImages;
  usage: number;
  created_at: string;
  publicUrls?: TemplatePublicUrls;
  // Populated via JOIN query
  prompt?: Prompt;
}

// For backward compatibility and convenience in API responses
export interface TemplateWithPrompt extends Template {
  prompt: Prompt;
  // Convenience fields (denormalized from prompt for easy access)
  theme: string | null;
  promptText: string;
}

export interface TemplatesResponse {
  items: TemplateWithPrompt[];
  count: number;
}

