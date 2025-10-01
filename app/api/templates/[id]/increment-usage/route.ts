import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

// POST /api/templates/[id]/increment-usage
// Increments the usage count for a template when user selects it
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Increment usage count
    const { data, error } = await supabase
      .from("templates")
      .update({ usage: supabase.raw("usage + 1") as any })
      .eq("id", id)
      .select("id, usage")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, id: data.id, usage: data.usage });
  } catch (e: any) {
    console.error(`/api/templates/${params?.id}/increment-usage error:`, e);
    return NextResponse.json({ error: e?.message ?? "Failed to increment usage" }, { status: 500 });
  }
}

