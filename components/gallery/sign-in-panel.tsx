"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export function GallerySignInPanel() {
  const { L } = useI18n();
  return (
    <div className="container px-4 py-10 sm:py-14">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">{L.gallery.title}</h1>
        <p className="text-muted-foreground mb-6">{L.gallery.signInPrompt}</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/sign-in" className="btn btn-primary px-4 py-2 rounded-md bg-primary text-primary-foreground">
            {L.gallery.signIn}
          </Link>
          <Link href="/sign-up" className="px-4 py-2 rounded-md border">
            {L.gallery.createAccount}
          </Link>
        </div>
      </div>
    </div>
  );
}

