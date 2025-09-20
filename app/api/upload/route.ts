import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import crypto from "crypto";


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
// Compute SHA-256 hex of an ArrayBuffer
async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hash = crypto.createHash("sha256");
  hash.update(Buffer.from(buffer));
  return hash.digest("hex");
}

function readUInt32BE(arr: Uint8Array, offset: number): number {
  return ((arr[offset] << 24) | (arr[offset + 1] << 16) | (arr[offset + 2] << 8) | arr[offset + 3]) >>> 0;
}

function getPngDimensions(bytes: Uint8Array): { width: number; height: number } | undefined {
  // PNG signature at 0..7, IHDR width/height at 16..23
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    const width = readUInt32BE(bytes, 16);
    const height = readUInt32BE(bytes, 20);
    if (width > 0 && height > 0) return { width, height };
  }
  return undefined;
}

function getJpegDimensions(bytes: Uint8Array): { width: number; height: number } | undefined {
  // Minimal JPEG SOF parser
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return undefined;
  let offset = 2;
  while (offset + 1 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset++; continue; }
    let marker = bytes[offset + 1];
    offset += 2;
    // Standalone markers without length
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 1 >= bytes.length) break;
    const length = (bytes[offset] << 8) + bytes[offset + 1];
    if (length < 2 || offset + length > bytes.length) break;
    // SOF markers that contain size
    if (
      marker === 0xc0 || marker === 0xc1 || marker === 0xc2 || marker === 0xc3 ||
      marker === 0xc5 || marker === 0xc6 || marker === 0xc7 ||
      marker === 0xc9 || marker === 0xca || marker === 0xcb ||
      marker === 0xcd || marker === 0xce || marker === 0xcf
    ) {
      if (offset + 7 <= bytes.length) {
        const height = (bytes[offset + 3] << 8) + bytes[offset + 4];
        const width  = (bytes[offset + 5] << 8) + bytes[offset + 6];
        if (width > 0 && height > 0) return { width, height };
      }
      break;
    }
    offset += length;
  }
  return undefined;
}

function getWebpDimensions(bytes: Uint8Array): { width: number; height: number } | undefined {
  // Minimal RIFF WEBP parser (VP8X path). If different chunk, return undefined.
  if (bytes.length < 30) return undefined;
  if (bytes[0] !== 0x52 || bytes[1] !== 0x49 || bytes[2] !== 0x46 || bytes[3] !== 0x46) return undefined; // RIFF
  if (bytes[8] !== 0x57 || bytes[9] !== 0x45 || bytes[10] !== 0x42 || bytes[11] !== 0x50) return undefined; // WEBP
  // First chunk header at offset 12
  const fourCC = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  if (fourCC === 'VP8X') {
    // Payload starts at 20; flags[0..3], then 3-byte little-endian width-1 and height-1
    const widthMinus1  = bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
    const heightMinus1 = bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    const width = widthMinus1 + 1;
    const height = heightMinus1 + 1;
    if (width > 0 && height > 0) return { width, height };
  }
  return undefined;
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number } | undefined> {
  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    // Try fast paths by signature
    const png = getPngDimensions(buf);
    if (png) return png;
    const jpg = getJpegDimensions(buf);
    if (jpg) return jpg;
    const webp = getWebpDimensions(buf);
    if (webp) return webp;
    return undefined;
  } catch {
    return undefined;
  }
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
      id?: string;
      path: string;
      bucket: string;
      contentType: string;
      size: number;
      width?: number;
      height?: number;
      sha256?: string;
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

      // Pre-compute hash and dimensions for persistence
      const buffer = await file.arrayBuffer();
      const sha256 = await sha256Hex(buffer);
      const dims = await getImageDimensions(file);

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

      // Persist metadata to DB (for layout & constraints)
      const { data: inserted, error: insErr } = await supabase
        .from('pet_uploads')
        .insert({
          user_id: userId,
          bucket: BUCKET,
          path: objectPath,
          content_type: contentType,
          size: file.size,
          width: dims?.width ?? null,
          height: dims?.height ?? null,
          sha256,
          scan_status: 'pending',
        })
        .select('id')
        .single();
      if (insErr) {
        return NextResponse.json({ error: `Persist metadata failed: ${insErr.message}` }, { status: 500 });
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

      results.push({ id: inserted?.id, path: objectPath, bucket: BUCKET, contentType, size: file.size, width: dims?.width, height: dims?.height, sha256, signedUrl });
    }

    return NextResponse.json({ data: results });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}

