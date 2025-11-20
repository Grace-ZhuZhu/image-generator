/**
 * Type definitions for generated images
 */

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  template_id: string;
  created_at: string;
  size: string; // "1K" | "2K" | "4K"
  quality: string; // "normal" | "2k" | "4k"
}

/**
 * Results section view modes
 */
export type ResultsViewMode = "hidden" | "sidebar" | "expanded";

