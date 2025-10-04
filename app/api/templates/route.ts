import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// 启用 ISR（Incremental Static Regeneration）
// 每 60 秒重新验证缓存
export const revalidate = 60;

// GET /api/templates
// Query params:
// - theme: filter by theme (optional, "all" for all themes)
// - mode: "representatives" | "by-prompt" (default: "representatives")
// - prompt_id: required when mode is "by-prompt"
// - page: page number (default: 1)
// - limit: items per page (default: 50)
//
// Mode descriptions:
//   - "representatives": returns one image per prompt (highest usage)
//     - if theme="all": get representatives from all themes (paginated, 50 per page)
//     - if theme="holiday": get representatives from holiday theme only (paginated, 50 per page)
//   - "by-prompt": returns all images for a specific prompt_id (no pagination needed, <50 images per prompt)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const theme = searchParams.get("theme") || "all";
    const mode = searchParams.get("mode") || "representatives";
    const promptId = searchParams.get("prompt_id");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    // 记录请求信息（用于监控缓存命中率）
    const requestTime = Date.now();
    console.log(`[API Cache] Request: mode=${mode}, theme=${theme}, page=${page}, prompt_id=${promptId}`);

    const supabase = await createClient();

    // Mode: by-prompt - get all templates for a specific prompt
    if (mode === "by-prompt") {
      if (!promptId) {
        return NextResponse.json({ error: "prompt_id parameter required for by-prompt mode" }, { status: 400 });
      }

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
        .eq("prompt_id", promptId)
        .order("usage", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      const items = data.map((item: any) => {
        // 辅助函数：生成公共 URL（支持新旧两种数据格式）
        const getPublicUrls = (images: any) => {
          const pub = (path: string) => supabase.storage.from("templates").getPublicUrl(path).data.publicUrl;

          // 新格式：images.sm = { jpg: "path/sm.jpg", webp: "path/sm.webp" }
          if (images.sm && typeof images.sm === 'object' && 'jpg' in images.sm) {
            return {
              sm: { jpg: pub(images.sm.jpg), webp: pub(images.sm.webp) },
              md: { jpg: pub(images.md.jpg), webp: pub(images.md.webp) },
              lg: { jpg: pub(images.lg.jpg), webp: pub(images.lg.webp) },
              orig: { jpg: pub(images.orig.jpg), webp: pub(images.orig.webp) },
            };
          }

          // 旧格式：images.sm = "path/sm.jpg"（向后兼容）
          return {
            sm: { jpg: pub(images.sm), webp: pub(images.sm) }, // 回退到 JPEG
            md: { jpg: pub(images.md), webp: pub(images.md) },
            lg: { jpg: pub(images.lg), webp: pub(images.lg) },
            orig: { jpg: pub(images.orig), webp: pub(images.orig) },
          };
        };

        return {
          id: item.id,
          prompt_id: item.prompt_id,
          title: item.title,
          images: item.images,
          usage: item.usage,
          created_at: item.created_at,
          prompt: item.prompt,
          theme: item.prompt?.theme || null,
          promptText: item.prompt?.prompt || "",
          publicUrls: getPublicUrls(item.images),
        };
      });

      // 记录响应时间
      const responseTime = Date.now() - requestTime;
      console.log(`[API Cache] Response: mode=by-prompt, items=${items.length}, time=${responseTime}ms`);

      return NextResponse.json(
        { items, count: items.length, page, limit, total: items.length },
        {
          headers: {
            // public: 可以被任何缓存存储
            // s-maxage=300: CDN/代理缓存 5 分钟
            // stale-while-revalidate=600: 过期后 10 分钟内返回旧数据，同时后台重新验证
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        }
      );
    }

    // Mode: representatives - get one image per prompt (highest usage)
    // Step 1: Get all unique prompt_ids filtered by theme
    let promptQuery = supabase
      .from("prompts")
      .select("id, prompt, theme, created_by, created_at, updated_at")
      .not("theme", "is", null);

    if (theme !== "all") {
      promptQuery = promptQuery.ilike("theme", theme);
    }

    const { data: allPrompts, error: promptError } = await promptQuery;
    if (promptError) throw promptError;

    const totalPrompts = allPrompts.length;
    const paginatedPrompts = allPrompts.slice(offset, offset + limit);

    // 辅助函数：生成公共 URL（支持新旧两种数据格式）
    const getPublicUrls = (images: any) => {
      const pub = (path: string) => supabase.storage.from("templates").getPublicUrl(path).data.publicUrl;

      // 新格式：images.sm = { jpg: "path/sm.jpg", webp: "path/sm.webp" }
      if (images.sm && typeof images.sm === 'object' && 'jpg' in images.sm) {
        return {
          sm: { jpg: pub(images.sm.jpg), webp: pub(images.sm.webp) },
          md: { jpg: pub(images.md.jpg), webp: pub(images.md.webp) },
          lg: { jpg: pub(images.lg.jpg), webp: pub(images.lg.webp) },
          orig: { jpg: pub(images.orig.jpg), webp: pub(images.orig.webp) },
        };
      }

      // 旧格式：images.sm = "path/sm.jpg"（向后兼容）
      return {
        sm: { jpg: pub(images.sm), webp: pub(images.sm) }, // 回退到 JPEG
        md: { jpg: pub(images.md), webp: pub(images.md) },
        lg: { jpg: pub(images.lg), webp: pub(images.lg) },
        orig: { jpg: pub(images.orig), webp: pub(images.orig) },
      };
    };

    // Step 2: For each prompt, get the template with highest usage
    const representatives = await Promise.all(
      paginatedPrompts.map(async (prompt) => {
        const { data, error } = await supabase
          .from("templates")
          .select(`
            id,
            prompt_id,
            title,
            images,
            usage,
            created_at
          `)
          .eq("prompt_id", prompt.id)
          .order("usage", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error || !data) return null;

        return {
          id: data.id,
          prompt_id: data.prompt_id,
          title: data.title,
          images: data.images,
          usage: data.usage,
          created_at: data.created_at,
          prompt: prompt,
          theme: prompt.theme,
          promptText: prompt.prompt,
          publicUrls: getPublicUrls(data.images),
        };
      })
    );

    const items = representatives.filter((item) => item !== null);

    // 记录响应时间
    const responseTime = Date.now() - requestTime;
    console.log(`[API Cache] Response: mode=representatives, theme=${theme}, items=${items.length}, time=${responseTime}ms`);

    return NextResponse.json(
      {
        items,
        count: items.length,
        page,
        limit,
        total: totalPrompts
      },
      {
        headers: {
          // public: 可以被任何缓存存储
          // s-maxage=300: CDN/代理缓存 5 分钟
          // stale-while-revalidate=600: 过期后 10 分钟内返回旧数据，同时后台重新验证
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (e: any) {
    console.error("/api/templates GET error:", e);
    return NextResponse.json({ error: e?.message ?? "Failed to fetch templates" }, { status: 500 });
  }
}

