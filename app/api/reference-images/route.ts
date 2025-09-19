import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function parseOrder(value: string | null | undefined): "asc" | "desc" {
  return value === "asc" ? "asc" : "desc"; // default desc for popularity
}

function parsePositiveInt(value: string | null | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function parseBoolish(value: string | null | undefined): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams;

  const themeId = search.get("themeId");
  const sortParam = (search.get("sort") || "usage").toLowerCase(); // usage | created_at
  const order = parseOrder(search.get("order"));
  const page = parsePositiveInt(search.get("page"), 1);
  const limit = parsePositiveInt(search.get("limit"), 20);
  const offset = (page - 1) * limit;
  const featured = parseBoolish(search.get("featured"));

  try {
    const supabase = await createClient();

    let query = supabase
      .from("reference_images")
      .select(
        "id, theme_id, image_url, prompt_text, usage_count, is_featured, created_at, width, height",
        { count: "exact" }
      );

    if (themeId) {
      query = query.eq("theme_id", themeId);
    }

    if (typeof featured === "boolean") {
      query = query.eq("is_featured", featured);
    }

    // Sorting: default by popularity (usage_count), then created_at desc as tiebreaker
    if (sortParam === "created_at") {
      query = query.order("created_at", { ascending: order === "asc" }).order("usage_count", { ascending: false });
    } else {
      // usage
      query = query.order("usage_count", { ascending: order === "asc" }).order("created_at", { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: data ?? [], page, limit, total: count ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}

