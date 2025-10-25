"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function isValidEmail(email: string) {
  return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);
}

export default function AnnouncementNotify() {
  const { L } = useI18n();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess("");
    setError("");
    if (!isValidEmail(email)) {
      setError(L.notify.invalidEmail);
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || L.notify.failed);
      } else {
        setSuccess(data?.message || L.notify.successNew);
      }
    } catch (e) {
      setError(L.notify.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-2">
      <div className="rounded-md border bg-amber-50 dark:bg-amber-900/20 p-3">
        <div className="flex items-center justify-center gap-2 flex-wrap text-center">
          <p className="text-sm sm:text-base text-amber-900/90 dark:text-amber-200/90 m-0">{L.notify.bannerText}</p>
          <Button
            onClick={() => {
              setOpen(true);
              setSuccess("");
              setError("");
            }}
            size="sm"
            className="px-2 py-1 h-8 text-xs sm:text-sm border border-amber-200 bg-amber-100 text-amber-900 hover:bg-amber-200 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/40 transition-colors"
          >
            {L.notify.buttonText}
          </Button>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setEmail("");
            setError("");
            setSuccess("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{L.notify.dialogTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="notify-email" className="text-sm font-medium">
                {L.notify.emailLabel}
              </label>
              <Input
                id="notify-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            )}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {L.notify.cancel}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? L.notify.submitting : L.notify.submit}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

