import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { createClient as createSSRClient } from "@/utils/supabase/server";

function isValidEmail(email: string) {
  // Simple RFC5322-inspired check; good enough for UI/API validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/notify
// Body: { email: string }
// Stores a normalized, unique email for future launch notifications.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = (body?.email ?? "") as string;
    const email = String(rawEmail).trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    // Prefer service role if available (bypasses RLS for a simple public list); otherwise fall back to SSR anon client
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createServiceRoleClient()
      : await createSSRClient();

    // Prevent duplicates by checking first (also works without requiring a DB unique constraint)
    const { data: existing, error: selectErr } = await supabase
      .from("notify_subscribers")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (selectErr) {
      console.error("/api/notify select error:", selectErr);
      // continue, we'll try insert and handle duplicate error
    }

    if (existing) {
      return NextResponse.json({ ok: true, already: true });
    }

    // Insert new email; if a unique constraint exists on email, this will be safe on concurrent requests
    const { data: inserted, error } = await supabase
      .from("notify_subscribers")
      .insert({ email })
      .select("id, created_at")
      .single();

    if (error) {
      // Handle duplicate error gracefully if unique constraint is present
      if ((error as any)?.code === "23505") {
        return NextResponse.json({ ok: true, already: true });
      }
      console.error("/api/notify insert error:", error);
      return NextResponse.json({ ok: false, error: "Failed to save email" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: inserted?.id, created_at: inserted?.created_at });
  } catch (e: any) {
    console.error("/api/notify POST error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}

