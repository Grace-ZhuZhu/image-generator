import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Helper to parse boolean-ish query param values
function parseActiveParam(value: string | null | undefined): boolean | "all" {
  if (!value || value === "true") return true;
  if (value === "false") return false;
  if (value === "all") return "all";
  return true;
}

function parseOrder(value: string | null | undefined): "asc" | "desc" {
  return value === "desc" ? "desc" : "asc";
}

function parsePositiveInt(value: string | null | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams;

  const activeParam = parseActiveParam(search.get("active")); // true | false | 'all'
  const sort = (search.get("sort") || "sort_order").toLowerCase(); // sort_order|created_at|name|usage
  const order = parseOrder(search.get("order")); // asc|desc
  const page = parsePositiveInt(search.get("page"), 1);
  const limit = parsePositiveInt(search.get("limit"), 50);
  const offset = (page - 1) * limit;

  try {
    const supabase = await createClient();

    // Base query for themes
    let query = supabase
      .from("themes")
      .select("id,name,description,sort_order,is_active,created_at")
      .range(offset, offset + limit - 1);

    if (activeParam !== "all") {
      query = query.eq("is_active", activeParam);
    }

    // For usage sort, we'll sort in-memory after augmenting stats
    if (sort !== "usage") {
      const sortableColumns: Record<string, string> = {
        sort_order: "sort_order",
        created_at: "created_at",
        name: "name",
      };
      const col = sortableColumns[sort] || "sort_order";
      query = query.order(col as any, { ascending: order === "asc" });
    }

    const { data: themes, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!themes || themes.length === 0) {
      return NextResponse.json({ data: [], page, limit, total: 0 });
    }

    const themeIds = themes.map((t) => t.id);

    // Fetch reference image counts and total usage by theme in one go, then reduce in memory
    const { data: refs, error: refsError } = await supabase
      .from("reference_images")
      .select("theme_id, usage_count")
      .in("theme_id", themeIds);

    if (refsError) {
      return NextResponse.json({ error: refsError.message }, { status: 400 });
    }

    const statsMap = new Map<string, { image_count: number; total_usage_count: number }>();
    for (const id of themeIds) {
      statsMap.set(id, { image_count: 0, total_usage_count: 0 });
    }

    for (const r of refs || []) {
      const prev = statsMap.get(r.theme_id) || { image_count: 0, total_usage_count: 0 };
      statsMap.set(r.theme_id, {
        image_count: prev.image_count + 1,
        total_usage_count: prev.total_usage_count + (r.usage_count || 0),
      });
    }

    type ThemeRow = {
      id: string;
      name: string;
      description: string | null;
      sort_order: number;
      is_active: boolean;
      created_at: string;
    };

    let enriched = (themes as ThemeRow[]).map((t) => ({
      ...t,
      stats: statsMap.get(t.id) || { image_count: 0, total_usage_count: 0 },
    }));

    if (sort === "usage") {
      enriched = enriched.sort((a, b) => {
        const delta = (b.stats.total_usage_count || 0) - (a.stats.total_usage_count || 0);
        return order === "desc" ? delta : -delta;
      });
    }

    return NextResponse.json({ data: enriched, page, limit, total: enriched.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}

