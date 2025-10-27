import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { createClient as createSSRClient } from "@/utils/supabase/server";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Ensure the email exists in notify_subscribers table (idempotent).
 * - Normalizes email to lowercase and trims
 * - No-op if invalid or already exists
 */
export async function ensureSubscriber(rawEmail?: string | null): Promise<{ ok: boolean; already?: boolean; id?: string; created_at?: string }>{
  try {
    const email = String(rawEmail || "").trim().toLowerCase();
    if (!email || !isValidEmail(email)) return { ok: false };

    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createServiceRoleClient()
      : await createSSRClient();

    const { data: existing, error: selectErr } = await supabase
      .from("notify_subscribers")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) return { ok: true, already: true, id: existing.id } as any;

    if (selectErr) {
      // continue to try insert; if unique constraint exists, it will guard
      console.warn("ensureSubscriber select error (continuing):", selectErr);
    }

    const { data: inserted, error } = await supabase
      .from("notify_subscribers")
      .insert({ email })
      .select("id, created_at")
      .single();

    if (error) {
      // Gracefully handle unique violation if a unique index exists
      if ((error as any)?.code === "23505") {
        return { ok: true, already: true };
      }
      console.error("ensureSubscriber insert error:", error);
      return { ok: false };
    }

    return { ok: true, id: inserted?.id, created_at: (inserted as any)?.created_at };
  } catch (e) {
    console.error("ensureSubscriber unexpected error:", e);
    return { ok: false };
  }
}

