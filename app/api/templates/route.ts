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

      const { data, error } = await supabase
        .from("templates")
        .select("id, title, theme, prompt, images, usage, created_at")
        .eq("theme", theme)
        .order("usage", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Add public URLs
      const items = data.map((item) => ({
        ...item,
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
    // First, get all unique themes
    const { data: allTemplates, error: allError } = await supabase
      .from("templates")
      .select("theme")
      .not("theme", "is", null);

    if (allError) throw allError;

    const themes = [...new Set(allTemplates.map((t) => t.theme))];

    // For each theme, get the template with highest usage
    const representatives = await Promise.all(
      themes.map(async (themeKey) => {
        const { data, error } = await supabase
          .from("templates")
          .select("id, title, theme, prompt, images, usage, created_at")
          .eq("theme", themeKey)
          .order("usage", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error || !data) return null;

        return {
          ...data,
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

