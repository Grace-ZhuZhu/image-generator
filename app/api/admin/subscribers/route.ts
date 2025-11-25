import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { adminAccessAllowed } from "@/utils/admin";

// 强制动态渲染（因为需要读取 URL 参数）
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim();
    const format = (url.searchParams.get("format") || "json").toLowerCase();

    // Auth via SSR cookies
    const ssr = await createClient();
    const { data: { user } } = await ssr.auth.getUser();

    if (!user || !adminAccessAllowed(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use service role if present for unrestricted admin read
    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceRoleClient() : ssr;

    let query = db
      .from("notify_subscribers")
      .select("id,email,created_at")
      .order("created_at", { ascending: false });

    if (q) {
      query = query.ilike("email", `%${q}%`);
    }

    // To avoid huge payloads, cap at 50k rows for export
    const { data, error } = await query.limit(50000);
    if (error) {
      console.error("/api/admin/subscribers select error:", error);
      return NextResponse.json({ error: "Query failed" }, { status: 500 });
    }

    if (format === "csv") {
      const rows = data || [];
      const header = "email,created_at\n";
      const csvBody = rows
        .map((r: any) => {
          const email = String(r.email ?? "").replaceAll('"', '""');
          const created = new Date(r.created_at).toISOString();
          return `${email},${created}`;
        })
        .join("\n");
      const csv = header + csvBody + (csvBody ? "\n" : "");
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="notify-subscribers.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    console.error("/api/admin/subscribers GET error:", e);
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}

