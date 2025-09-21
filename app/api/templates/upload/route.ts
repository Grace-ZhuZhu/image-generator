export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

// POST /api/templates/upload
// form-data: file(Required), prompt(Required), title?, theme?
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const title = (form.get("title") as string) || null;
    const theme = (form.get("theme") as string) || null;
    const prompt = (form.get("prompt") as string) || "";

    if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });
    if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });

    if (!file.type?.startsWith("image/")) {
      return NextResponse.json({ error: "only image files are allowed" }, { status: 400 });
    }

    // Require sharp for image processing
    let sharp: any;
    try {
      sharp = (await import("sharp")).default;
    } catch (e) {
      return NextResponse.json({ error: "sharp is not installed" }, { status: 500 });
    }

    // Current user (optional, for created_by)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Service role client for storage + DB writes
    const svc = createServiceRoleClient();

    // Ensure buckets according to policy
    await Promise.all([
      svc.storage.createBucket("templates", { public: true }).catch(() => {}),
      svc.storage.createBucket("user-uploads", { public: false }).catch(() => {}),
    ]);

    const buf = Buffer.from(await file.arrayBuffer());
    const id = globalThis.crypto?.randomUUID?.() || (await import("crypto")).randomUUID();

    const sizes: Record<string, number> = { sm: 80, md: 320, lg: 640 };

    const upload = (key: string, data: Buffer) =>
      svc.storage.from("templates").upload(`${id}/${key}.jpg`, data, {
        upsert: true,
        contentType: "image/jpeg",
      });

    // Upload original (convert to jpeg for consistency)
    const origJpeg = await sharp(buf).jpeg({ quality: 90 }).toBuffer();
    await upload("orig", origJpeg);

    // Upload sizes
    await Promise.all(
      Object.entries(sizes).map(async ([k, w]) => {
        const resized = await sharp(origJpeg)
          .resize({ width: Number(w) })
          .jpeg({ quality: 82 })
          .toBuffer();
        await upload(k, resized);
      })
    );

    const images = {
      orig: `${id}/orig.jpg`,
      sm: `${id}/sm.jpg`,
      md: `${id}/md.jpg`,
      lg: `${id}/lg.jpg`,
    } as const;

    // Insert into templates table (single-language prompt)
    const { error } = await svc.from("templates").insert({
      id,
      title,
      theme,
      prompt,
      images,
      created_by: user?.id ?? null,
    });
    if (error) throw error;

    // Public URLs for immediate rendering
    const pub = (path: string) =>
      svc.storage.from("templates").getPublicUrl(path).data.publicUrl;

    return NextResponse.json(
      {
        id,
        images,
        publicUrls: {
          orig: pub(images.orig),
          sm: pub(images.sm),
          md: pub(images.md),
          lg: pub(images.lg),
        },
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("/api/templates/upload error:", e);
    return NextResponse.json({ error: e?.message ?? "upload failed" }, { status: 500 });
  }
}

