import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

// POST /api/templates/[id]/increment-usage
// Increments the usage count for a template when user selects it
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // First get current usage
    const { data: current, error: fetchError } = await supabase
      .from("templates")
      .select("usage")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // Then update with incremented value
    const { data, error } = await supabase
      .from("templates")
      .update({ usage: (current?.usage || 0) + 1 })
      .eq("id", id)
      .select("id, usage")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, id: data.id, usage: data.usage });
  } catch (e: any) {
    console.error(`/api/templates/[id]/increment-usage error:`, e);
    return NextResponse.json({ error: e?.message ?? "Failed to increment usage" }, { status: 500 });
  }
}

