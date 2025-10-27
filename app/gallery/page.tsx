import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import Link from "next/link";


export const dynamic = "force-dynamic";

import { GallerySignInPanel } from "@/components/gallery/sign-in-panel";
import { GalleryEmptyPanel } from "@/components/gallery/empty-panel";
import { GalleryHeaderBar } from "@/components/gallery/header-bar";

export default async function GalleryPage() {

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <GallerySignInPanel />;
  }

  // Try to load generated images first (if table exists)
  let images: { url: string; created_at: string }[] = [];

  try {
    const { data, error } = await supabase
      .from("pet_generations")
      .select("generated_image_url, created_at")
      .eq("user_id", user.id)
      .eq("generation_status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(60);

    if (!error && data) {
      images = (data || [])
        .filter((r: any) => r.generated_image_url)
        .map((r: any) => ({ url: r.generated_image_url as string, created_at: r.created_at as string }));
    }
  } catch (_) {
    // ignore and fallback
  }

  // Fallback: show recent uploads with signed URLs (bucket may be private)
  if (images.length === 0) {
    const { data: uploads } = await supabase
      .from("pet_uploads")
      .select("bucket, path, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60);

    if (uploads && uploads.length > 0) {
      const signed: { url: string; created_at: string }[] = [];
      for (const u of uploads as any[]) {
        const bucket = u.bucket as string;
        const path = u.path as string;
        const { data: signedUrlData } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 60 * 60);
        if (signedUrlData?.signedUrl) {
          signed.push({ url: signedUrlData.signedUrl, created_at: u.created_at as string });
        }
      }
      images = signed;
    }
  }

  if (images.length === 0) {
    return <GalleryEmptyPanel />;
  }

  return (
    <div className="container px-4 py-8 sm:py-12">
      <GalleryHeaderBar />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {images.map((img, idx) => (
          <div key={idx} className="relative aspect-square overflow-hidden rounded-lg border bg-muted/10">
            {/* Using next/image for optimization; signed URLs and remote patterns are configured */}
            <Image
              src={img.url}
              alt={`Pet photo ${idx + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

