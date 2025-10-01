export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { isDev } from "@/utils/admin";

// POST /api/templates/upload
// 支持一次上传多张图片并复用相同的 prompt/title/theme
// form-data:
// - files: File[]        (推荐，支持多选)
// - file: File           (兼容单文件)
// - prompt: string       (必填)
// - title?: string
// - theme?: string
export async function POST(req: Request) {
  try {
    // Dev-only: disable in production
    if (!isDev()) {
      return NextResponse.json({ error: "Disabled in production" }, { status: 403 });
    }

    const form = await req.formData();
    const title = (form.get("title") as string) || null;
    const theme = (form.get("theme") as string) || null;
    const prompt = (form.get("prompt") as string) || "";

    // Gather files (prefer files[], fallback to single file)
    const fromArray = (form.getAll("files") || []).filter((f): f is File => f instanceof File);
    const single = form.get("file");
    const files: File[] = [...fromArray, ...(single instanceof File ? [single] : [])];

    if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    if (files.length === 0) return NextResponse.json({ error: "files are required" }, { status: 400 });

    if (!files.every((f) => f.type?.startsWith("image/"))) {
      return NextResponse.json({ error: "only image files are allowed" }, { status: 400 });
    }

    // Require sharp for image processing
    let sharp: any;
    try {
      sharp = (await import("sharp")).default;
    } catch (e) {
      return NextResponse.json({ error: "sharp is not installed" }, { status: 500 });
    }

    // Service role client for storage + DB writes
    const svc = createServiceRoleClient();

    // Ensure buckets according to policy
    await Promise.all([
      svc.storage.createBucket("templates", { public: true }).catch(() => {}),
      svc.storage.createBucket("user-uploads", { public: false }).catch(() => {}),
    ]);

    const sizes: Record<string, number> = { sm: 80, md: 320, lg: 640 };

    const processOne = async (file: File) => {
      const id = globalThis.crypto?.randomUUID?.() || (await import("crypto")).randomUUID();
      const upload = (key: string, data: Buffer) =>
        svc.storage.from("templates").upload(`${id}/${key}.jpg`, data, {
          upsert: true,
          contentType: "image/jpeg",
        });
      const buf = Buffer.from(await file.arrayBuffer());
      const origJpeg = await sharp(buf).jpeg({ quality: 90 }).toBuffer();
      await upload("orig", origJpeg);
      await Promise.all(
        Object.entries(sizes).map(async ([k, w]) => {
          const resized = await sharp(origJpeg)
            .resize({ width: Number(w) })
            .jpeg({ quality: 82 })
            .toBuffer();
          await upload(k, resized);
        })
      );
      const images = { orig: `${id}/orig.jpg`, sm: `${id}/sm.jpg`, md: `${id}/md.jpg`, lg: `${id}/lg.jpg` } as const;
      return { id, images };
    }

    const items = await Promise.all(files.map((f) => processOne(f)));

    // Step 1: Create or find the prompt record
    // Check if a prompt with the same prompt+theme combination already exists
    // Note: title is NOT stored in prompts table - it's stored per template
    let promptId: string;

    const { data: existingPrompt, error: findError } = await svc
      .from("prompts")
      .select("id")
      .eq("prompt", prompt)
      .eq("theme", theme || null)
      .maybeSingle();

    if (findError) throw findError;

    if (existingPrompt) {
      // Use existing prompt
      promptId = existingPrompt.id;
    } else {
      // Create new prompt (without title - title is per-template)
      const { data: newPrompt, error: insertError } = await svc
        .from("prompts")
        .insert({
          prompt,
          theme,
          created_by: null,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      promptId = newPrompt.id;
    }

    // Step 2: Insert template records with reference to the prompt
    // title is stored in templates table as it's image-specific (for alt text)
    const rows = items.map((it) => ({
      id: it.id,
      prompt_id: promptId,
      title,  // title is stored per template, not per prompt
      images: it.images,
      created_by: null,
    }));

    const { error } = await svc.from("templates").insert(rows);
    if (error) throw error;

    const pub = (path: string) => svc.storage.from("templates").getPublicUrl(path).data.publicUrl;

    return NextResponse.json(
      {
        prompt,
        title,
        theme,
        promptId,
        items: items.map(({ id, images }) => ({
          id,
          images,
          publicUrls: {
            orig: pub(images.orig),
            sm: pub(images.sm),
            md: pub(images.md),
            lg: pub(images.lg),
          },
        })),
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("/api/templates/upload error:", e);
    return NextResponse.json({ error: e?.message ?? "upload failed" }, { status: 500 });
  }
}

