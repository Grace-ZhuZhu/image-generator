import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

// Config
const BUCKET = "pet-uploads"; // ensure this bucket exists and policies allow user to upload to uploads/{uid}/raw/*
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_REQUEST = 3;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getExtFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "bin";
}

// Basic magic-number checks for JPEG/PNG/WEBP
async function validateFileSignature(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (head.length >= 8 && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47 && head[4] === 0x0d && head[5] === 0x0a && head[6] === 0x1a && head[7] === 0x0a) {
    return true;
  }
  // JPEG: FF D8 FF
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return true;
  }
  // WEBP (RIFF....WEBP)
  if (head.length >= 12 && head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 && head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50) {
    return true;
  }
  return false;
}

// Extract all files from form-data supporting different field names
function extractFiles(form: FormData): File[] {
  const files: File[] = [];
  // Common names: file, files, files[]
  for (const [key, value] of form.entries()) {
    if (!(value instanceof File)) continue;
    if (key === "file" || key === "files" || key === "files[]" || key.startsWith("file")) {
      files.push(value);
    }
  }
  return files;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = userData.user.id;

    const form = await request.formData();
    const files = extractFiles(form);

    if (files.length === 0) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json({ error: `Too many files. Max ${MAX_FILES_PER_REQUEST}` }, { status: 400 });
    }

    const results: Array<{
      path: string;
      bucket: string;
      contentType: string;
      size: number;
      signedUrl?: string;
    }> = [];

    for (const file of files) {
      const contentType = file.type;
      if (!ALLOWED_TYPES.has(contentType)) {
        return NextResponse.json({ error: `Unsupported file type: ${contentType}` }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `File too large. Max ${MAX_FILE_SIZE} bytes` }, { status: 400 });
      }
      const signatureOk = await validateFileSignature(file);
      if (!signatureOk) {
        return NextResponse.json({ error: "Invalid file signature" }, { status: 400 });
      }

      const ext = getExtFromMime(contentType);
      const ts = Date.now();
      const rand = Math.random().toString(36).slice(2, 10);
      const objectPath = `uploads/${userId}/raw/${ts}_${rand}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(objectPath, file, {
          cacheControl: "3600",
          contentType,
          upsert: false,
        });
      if (upErr) {
        return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });
      }

      // Try to create a short-lived signed URL for immediate preview/download
      let signedUrl: string | undefined = undefined;
      try {
        const service = createServiceRoleClient();
        const { data: signed } = await service.storage.from(BUCKET).createSignedUrl(objectPath, 60 * 60); // 1h
        signedUrl = signed?.signedUrl;
      } catch {
        // ignore; fall back to returning path
      }

      results.push({ path: objectPath, bucket: BUCKET, contentType, size: file.size, signedUrl });
    }

    return NextResponse.json({ data: results });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}

