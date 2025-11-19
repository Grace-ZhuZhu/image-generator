import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { isDev } from "@/utils/admin";

export const dynamic = "force-dynamic";

// POST /api/templates/[id]/set-featured
// Sets a template as the featured/display image for its prompt
// This is done by setting its usage to be higher than all other templates in the same prompt
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Dev-only: disable in production
    if (!isDev()) {
      return NextResponse.json({ error: "Disabled in production" }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // First get the template and its prompt_id
    const { data: template, error: fetchError } = await supabase
      .from("templates")
      .select("id, prompt_id, usage")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Get the highest usage count among all templates with the same prompt_id
    const { data: templates, error: templatesError } = await supabase
      .from("templates")
      .select("usage")
      .eq("prompt_id", template.prompt_id)
      .order("usage", { ascending: false })
      .limit(1);

    if (templatesError) throw templatesError;

    const maxUsage = templates && templates.length > 0 ? templates[0].usage : 0;
    const newUsage = Math.max(maxUsage + 1, 1000); // Set to at least 1000 or max+1

    // Update this template's usage to be the highest
    const { data, error } = await supabase
      .from("templates")
      .update({ usage: newUsage })
      .eq("id", id)
      .select("id, usage")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, id: data.id, usage: data.usage });
  } catch (e: any) {
    console.error(`/api/templates/[id]/set-featured error:`, e);
    return NextResponse.json({ error: e?.message ?? "Failed to set featured" }, { status: 500 });
  }
}

