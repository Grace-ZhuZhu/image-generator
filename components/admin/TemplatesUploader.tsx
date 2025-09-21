"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function TemplatesUploader() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const canSubmit = useMemo(() => !!file && !!prompt.trim(), [file, prompt]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("file", file!);
      fd.append("prompt", prompt.trim());
      if (title.trim()) fd.append("title", title.trim());
      if (theme.trim()) fd.append("theme", theme.trim());
      const res = await fetch("/api/templates/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }
      const data = await res.json();
      toast({ title: "Uploaded", description: `Template ${data.id} created.` });
      // reset
      setFile(null);
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
          <Label>Template Image</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {preview && (
            <img src={preview} alt="preview" className="mt-2 h-32 w-32 object-cover rounded border" />
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
          <Button type="submit" disabled={!canSubmit || loading}>
            {loading ? "Uploading..." : "Upload Template"}
          </Button>
          {!canSubmit && <span className="text-sm text-muted-foreground">Select image and enter prompt to enable</span>}
        </div>
      </form>
    </div>
  );
}

