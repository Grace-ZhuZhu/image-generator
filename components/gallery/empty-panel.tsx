"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export function GalleryEmptyPanel() {
  const { L } = useI18n();
  return (
    <div className="container px-4 py-10 sm:py-14">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">{L.gallery.title}</h1>
        <p className="text-muted-foreground mb-6">{L.gallery.emptyPrompt}</p>
        <Link href="/" className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground">
          {L.gallery.createCta}
        </Link>
      </div>
    </div>
  );
}

