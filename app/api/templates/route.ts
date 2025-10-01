import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/templates
// Query params:
// - theme: filter by theme (optional, "all" for all themes)
// - mode: "representatives" | "by-theme" (default: "representatives")
//   - "representatives": returns one image per theme (highest usage)
//   - "by-theme": returns all images for specified theme
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const theme = searchParams.get("theme") || "all";
    const mode = searchParams.get("mode") || "representatives";

    const supabase = await createClient();

    if (mode === "by-theme") {
      // Get all templates for a specific theme
      if (theme === "all") {
        return NextResponse.json({ error: "theme parameter required for by-theme mode" }, { status: 400 });
      }

      // JOIN with prompts table to get prompt details
      const { data, error } = await supabase
        .from("templates")
        .select(`
          id,
          prompt_id,
          title,
          images,
          usage,
          created_at,
          prompt:prompts (
            id,
            prompt,
            theme,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq("prompts.theme", theme)
        .order("usage", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data to match TemplateWithPrompt interface
      const items = data.map((item: any) => ({
        id: item.id,
        prompt_id: item.prompt_id,
        title: item.title,  // title is from templates table
        images: item.images,
        usage: item.usage,
        created_at: item.created_at,
        prompt: item.prompt,
        // Convenience fields for backward compatibility
        theme: item.prompt?.theme || null,
        promptText: item.prompt?.prompt || "",
        publicUrls: {
          sm: supabase.storage.from("templates").getPublicUrl(item.images.sm).data.publicUrl,
          md: supabase.storage.from("templates").getPublicUrl(item.images.md).data.publicUrl,
          lg: supabase.storage.from("templates").getPublicUrl(item.images.lg).data.publicUrl,
          orig: supabase.storage.from("templates").getPublicUrl(item.images.orig).data.publicUrl,
        },
      }));

      return NextResponse.json({ items, count: items.length });
    }

    // Default mode: "representatives" - get one image per theme (highest usage)
    // First, get all unique themes from prompts table
    const { data: allPrompts, error: allError } = await supabase
      .from("prompts")
      .select("theme")
      .not("theme", "is", null);

    if (allError) throw allError;

    const themes = [...new Set(allPrompts.map((p) => p.theme))];

    // For each theme, get the template with highest usage
    const representatives = await Promise.all(
      themes.map(async (themeKey) => {
        const { data, error } = await supabase
          .from("templates")
          .select(`
            id,
            prompt_id,
            title,
            images,
            usage,
            created_at,
            prompt:prompts (
              id,
              prompt,
              theme,
              created_by,
              created_at,
              updated_at
            )
          `)
          .eq("prompts.theme", themeKey)
          .order("usage", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error || !data) return null;

        return {
          id: data.id,
          prompt_id: data.prompt_id,
          title: data.title,  // title is from templates table
          images: data.images,
          usage: data.usage,
          created_at: data.created_at,
          prompt: data.prompt,
          // Convenience fields for backward compatibility
          theme: (data.prompt as any)?.theme || null,
          promptText: (data.prompt as any)?.prompt || "",
          publicUrls: {
            sm: supabase.storage.from("templates").getPublicUrl(data.images.sm).data.publicUrl,
            md: supabase.storage.from("templates").getPublicUrl(data.images.md).data.publicUrl,
            lg: supabase.storage.from("templates").getPublicUrl(data.images.lg).data.publicUrl,
            orig: supabase.storage.from("templates").getPublicUrl(data.images.orig).data.publicUrl,
          },
        };
      })
    );

    const items = representatives.filter((item) => item !== null);

    // Filter by theme if specified
    const filtered = theme === "all" ? items : items.filter((item) => item.theme === theme);

    return NextResponse.json({ items: filtered, count: filtered.length });
  } catch (e: any) {
    console.error("/api/templates GET error:", e);
    return NextResponse.json({ error: e?.message ?? "Failed to fetch templates" }, { status: 500 });
  }
}

