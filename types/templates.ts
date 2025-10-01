export interface TemplateImages {
  sm: string;
  md: string;
  lg: string;
  orig: string;
}

export interface TemplatePublicUrls {
  sm: string;
  md: string;
  lg: string;
  orig: string;
}

export interface Template {
  id: string;
  title: string | null;
  theme: string | null;
  prompt: string;
  images: TemplateImages;
  usage: number;
  created_at: string;
  publicUrls?: TemplatePublicUrls;
}

export interface TemplatesResponse {
  items: Template[];
  count: number;
}

