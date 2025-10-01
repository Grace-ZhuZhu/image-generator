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

