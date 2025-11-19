export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { isDev } from "@/utils/admin";

// POST /api/templates/append
// 为已存在的 prompt_id 补充上传新的模板图片
// form-data:
// - files: File[]        (推荐，支持多选)
// - file: File           (兼容单文件)
// - prompt_id: string    (必填，已存在的 prompt ID)
// - title?: string       (可选，图片标题)
export async function POST(req: Request) {
  try {
    // Dev-only: disable in production
    if (!isDev()) {
      return NextResponse.json({ error: "Disabled in production" }, { status: 403 });
    }

    const form = await req.formData();
    const promptId = (form.get("prompt_id") as string) || "";
    const title = (form.get("title") as string) || null;

    // Gather files (prefer files[], fallback to single file)
    const fromArray = (form.getAll("files") || []).filter((f): f is File => f instanceof File);
    const single = form.get("file");
    const files: File[] = [...fromArray, ...(single instanceof File ? [single] : [])];

    if (!promptId) {
      return NextResponse.json({ error: "prompt_id is required" }, { status: 400 });
    }
    if (files.length === 0) {
      return NextResponse.json({ error: "files are required" }, { status: 400 });
    }

    if (!files.every((f) => f.type?.startsWith("image/"))) {
      return NextResponse.json({ error: "only image files are allowed" }, { status: 400 });
    }

    // Service role client for storage + DB writes
    const svc = createServiceRoleClient();

    // Verify that the prompt_id exists
    const { data: existingPrompt, error: promptError } = await svc
      .from("prompts")
      .select("id, prompt, theme")
      .eq("id", promptId)
      .single();

    if (promptError || !existingPrompt) {
      return NextResponse.json(
        { error: "Prompt ID not found" },
        { status: 404 }
      );
    }

    // Require sharp for image processing
    let sharp: any;
    try {
      sharp = (await import("sharp")).default;
    } catch (e) {
      return NextResponse.json({ error: "sharp is not installed" }, { status: 500 });
    }

    // Ensure buckets according to policy
    await Promise.all([
      svc.storage.createBucket("templates", { public: true }).catch(() => {}),
    ]);

    const sizes: Record<string, number> = { sm: 80, md: 320, lg: 640 };

    const processOne = async (file: File) => {
      const id = globalThis.crypto?.randomUUID?.() || (await import("crypto")).randomUUID();

      // 上传函数：支持指定格式和 contentType
      const upload = (key: string, data: Buffer, contentType: string) =>
        svc.storage.from("templates").upload(`${id}/${key}`, data, {
          upsert: true,
          contentType,
          cacheControl: "public, max-age=31536000, immutable",
        });

      const buf = Buffer.from(await file.arrayBuffer());

      // 处理原图：生成 JPEG 和 WebP 两种格式
      const origJpeg = await sharp(buf).jpeg({ quality: 90 }).toBuffer();
      const origWebp = await sharp(buf).webp({ quality: 85 }).toBuffer();

      await Promise.all([
        upload("orig.jpg", origJpeg, "image/jpeg"),
        upload("orig.webp", origWebp, "image/webp"),
      ]);

      // 处理各个尺寸：为每个尺寸生成 JPEG 和 WebP
      await Promise.all(
        Object.entries(sizes).map(async ([sizeName, width]) => {
          const resized = sharp(buf).resize({ width: Number(width) });

          const [jpegBuffer, webpBuffer] = await Promise.all([
            resized.clone().jpeg({ quality: 82 }).toBuffer(),
            resized.clone().webp({ quality: 78 }).toBuffer(),
          ]);

          return Promise.all([
            upload(`${sizeName}.jpg`, jpegBuffer, "image/jpeg"),
            upload(`${sizeName}.webp`, webpBuffer, "image/webp"),
          ]);
        })
      );

      // 构建图片路径对象（新的多格式结构）
      const images = {
        orig: { jpg: `${id}/orig.jpg`, webp: `${id}/orig.webp` },
        sm: { jpg: `${id}/sm.jpg`, webp: `${id}/sm.webp` },
        md: { jpg: `${id}/md.jpg`, webp: `${id}/md.webp` },
        lg: { jpg: `${id}/lg.jpg`, webp: `${id}/lg.webp` },
      };

      return { id, images };
    };

    const items = await Promise.all(files.map((f) => processOne(f)));

    // Insert template records with reference to the existing prompt
    const rows = items.map((it) => ({
      id: it.id,
      prompt_id: promptId,
      title,
      images: it.images,
      created_by: null,
    }));

    const { error } = await svc.from("templates").insert(rows);
    if (error) throw error;

    const pub = (path: string) => svc.storage.from("templates").getPublicUrl(path).data.publicUrl;

    return NextResponse.json(
      {
        promptId,
        prompt: existingPrompt.prompt,
        theme: existingPrompt.theme,
        title,
        items: items.map(({ id, images }) => ({
          id,
          images,
          publicUrls: {
            orig: { jpg: pub(images.orig.jpg), webp: pub(images.orig.webp) },
            sm: { jpg: pub(images.sm.jpg), webp: pub(images.sm.webp) },
            md: { jpg: pub(images.md.jpg), webp: pub(images.md.webp) },
            lg: { jpg: pub(images.lg.jpg), webp: pub(images.lg.webp) },
          },
        })),
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("/api/templates/append error:", e);
    return NextResponse.json({ error: e?.message ?? "append failed" }, { status: 500 });
  }
}

