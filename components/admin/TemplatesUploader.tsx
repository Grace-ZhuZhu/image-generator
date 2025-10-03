"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function TemplatesUploader() {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [prompt, setPrompt] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // manage object URLs
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPreviews(files.map((f) => URL.createObjectURL(f)));
    // cleanup when unmount or files change next time
    return () => {
      files.forEach((f, i) => {
        const url = previews[i];
        if (url) URL.revokeObjectURL(url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const canSubmit = useMemo(() => files.length > 0 && !!prompt.trim(), [files, prompt]);

  const removeAt = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;
    setFiles((prev) => [...prev, ...picked]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setLoading(true);
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      fd.append("prompt", prompt.trim());
      if (title.trim()) fd.append("title", title.trim());
      if (theme.trim()) fd.append("theme", theme.trim());
      const res = await fetch("/api/templates/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      toast({ title: "Uploaded", description: `Created ${data.items?.length || 0} templates.` });
      // reset
      setFiles([]);
      setTitle("");
      setTheme("");
      setPrompt("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <h1 className="text-xl font-semibold mb-4">Templates – Upload</h1>
      <div className="mb-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-xs">
          开发模式 DEV
        </span>
        <span className="ml-2 text-xs text-muted-foreground">仅用于开发调试，生产环境已隐藏</span>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Template Images (支持多选)</Label>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onFileChange} />
          {previews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative h-20 w-20">
                  <Image
                    src={src}
                    alt={`preview-${i}`}
                    width={80}
                    height={80}
                    className="h-20 w-20 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full border bg-background text-muted-foreground hover:bg-muted"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label>Title (optional)</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Christmas Puppy" />
        </div>
        <div className="space-y-2">
          <Label>Theme (optional)</Label>
          <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="e.g. holiday" />
        </div>
        <div className="space-y-2">
          <Label>Prompt</Label>
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5} placeholder="Describe the template prompt..." />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!canSubmit || loading}>{loading ? "Uploading..." : "Upload Templates"}</Button>
          {!canSubmit && <span className="text-sm text-muted-foreground">Select images and enter prompt to enable</span>}
        </div>
      </form>
    </div>
  );
}

