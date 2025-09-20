import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

// Optional external scanner webhook
const SCAN_WEBHOOK = process.env.VIRUS_SCAN_WEBHOOK_URL; // e.g. your scanner endpoint

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = userData.user.id;

    const body = await request.json().catch(() => ({}));
    const uploadId: string | undefined = body?.uploadId;
    if (!uploadId) return NextResponse.json({ error: "uploadId is required" }, { status: 400 });

    // Verify ownership
    const { data: upload, error } = await supabase
      .from('pet_uploads')
      .select('*')
      .eq('id', uploadId)
      .eq('user_id', userId)
      .single();
    if (error || !upload) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!SCAN_WEBHOOK) {
      return NextResponse.json({ error: "Scanner not configured", hint: "Set VIRUS_SCAN_WEBHOOK_URL" }, { status: 501 });
    }

    // Create a short-lived signed URL for the scanner to download
    const service = createServiceRoleClient();
    const { data: signed, error: signErr } = await service.storage
      .from(upload.bucket)
      .createSignedUrl(upload.path, 60 * 10); // 10 minutes
    if (signErr || !signed?.signedUrl) {
      return NextResponse.json({ error: "Failed to sign URL for scanning" }, { status: 500 });
    }

    // Mark as scanning
    await service.from('pet_uploads').update({ scan_status: 'scanning' }).eq('id', uploadId);

    // Call external scanner
    const res = await fetch(SCAN_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId,
        url: signed.signedUrl,
        contentType: upload.content_type,
        size: upload.size,
        userId,
      }),
    });

    // Expect JSON { status: 'clean'|'infected'|'failed', metadata?: any }
    let status: 'clean'|'infected'|'failed' = 'failed';
    let metadata: any = {};
    try {
      const json = await res.json();
      if (json?.status === 'clean' || json?.status === 'infected' || json?.status === 'failed') {
        status = json.status;
        metadata = json.metadata ?? {};
      }
    } catch {}

    await service.from('pet_uploads').update({ scan_status: status, scan_metadata: metadata }).eq('id', uploadId);

    return NextResponse.json({ data: { uploadId, scan_status: status, scan_metadata: metadata } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}

