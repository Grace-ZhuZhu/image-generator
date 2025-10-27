"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export function GalleryHeaderBar() {
  const { L } = useI18n();
  return (
    <div className="flex items-end justify-between mb-4 sm:mb-6">
      <h1 className="text-2xl sm:text-3xl font-bold">{L.gallery.title}</h1>
      <Link href="/" className="text-sm text-primary hover:underline">
        {L.gallery.createMore}
      </Link>
    </div>
  );
}

