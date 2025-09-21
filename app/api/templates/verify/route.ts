import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const svc = createServiceRoleClient();
    const { count, error } = await svc
      .from("templates")
      .select("id", { count: "exact", head: true });

    if (error) throw error;

    return NextResponse.json({ ok: true, count });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}

