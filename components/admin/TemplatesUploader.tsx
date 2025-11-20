"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, Check, Trash2 } from "lucide-react";
import { getImageUrl } from "@/utils/image-url-helper";

export default function TemplatesUploader() {
  const { toast } = useToast();

  // Upload tab state
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [prompt, setPrompt] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Append tab state
  const [appendPromptId, setAppendPromptId] = useState("");
  const [appendFiles, setAppendFiles] = useState<File[]>([]);
  const [appendTitle, setAppendTitle] = useState("");
  const [appendPreviews, setAppendPreviews] = useState<string[]>([]);
  const [appendLoading, setAppendLoading] = useState(false);
  const [existingTemplates, setExistingTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [featuredTemplateId, setFeaturedTemplateId] = useState<string | null>(null);
  const appendFileInputRef = useRef<HTMLInputElement>(null);

  // Generate tab state
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<{
    url: string;
    size: string;
  } | null>(null);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [referencePreviews, setReferencePreviews] = useState<string[]>([]);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // manage object URLs for upload tab
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPreviews(files.map((f) => URL.createObjectURL(f)));
    // cleanup when unmount or files change next time
    return () => {
      previews.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  useEffect(() => {
    // manage object URLs for reference images in generate tab
    referencePreviews.forEach((url) => URL.revokeObjectURL(url));
    setReferencePreviews(referenceImages.map((f) => URL.createObjectURL(f)));
    return () => {
      referencePreviews.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceImages]);

  useEffect(() => {
    // manage object URLs for append tab
    appendPreviews.forEach((url) => URL.revokeObjectURL(url));
    setAppendPreviews(appendFiles.map((f) => URL.createObjectURL(f)));
    return () => {
      appendPreviews.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appendFiles]);

  // Fetch existing templates when prompt ID changes
  useEffect(() => {
    if (!appendPromptId.trim()) {
      setExistingTemplates([]);
      setFeaturedTemplateId(null);
      return;
    }

    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const res = await fetch(`/api/templates?mode=by-prompt&prompt_id=${appendPromptId.trim()}`);
        if (!res.ok) {
          if (res.status === 404) {
            toast({ title: "Prompt not found", description: "The prompt ID does not exist", variant: "destructive" });
          }
          throw new Error(await res.text());
        }
        const data = await res.json();
        setExistingTemplates(data.items || []);

        // Find the current featured template (highest usage)
        if (data.items && data.items.length > 0) {
          const featured = data.items.reduce((highest: any, current: any) =>
            (current.usage > highest.usage) ? current : highest
          );
          setFeaturedTemplateId(featured.id);
        }
      } catch (e: any) {
        console.error("Failed to load templates:", e);
        setExistingTemplates([]);
        setFeaturedTemplateId(null);
      } finally {
        setLoadingTemplates(false);
      }
    };

    // Debounce the fetch to avoid too many requests
    const timer = setTimeout(fetchTemplates, 500);
    return () => clearTimeout(timer);
  }, [appendPromptId, toast]);

  const canSubmit = useMemo(() => files.length > 0 && !!prompt.trim(), [files, prompt]);
  const canAppend = useMemo(
    () => appendFiles.length > 0 && !!appendPromptId.trim(),
    [appendFiles, appendPromptId]
  );

  // Character counter helper
  const getCharCount = (text: string) => {
    // Count Chinese characters and English words separately
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = text
      .replace(/[\u4e00-\u9fa5]/g, "") // Remove Chinese characters
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return { chineseChars, englishWords, total: text.length };
  };

  const generateCharCount = getCharCount(generatePrompt);
  const isGeneratePromptValid = generatePrompt.trim().length > 0;
  const isPromptTooLong =
    generateCharCount.chineseChars > 300 ||
    generateCharCount.englishWords > 600;

  const removeAt = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;
    setFiles((prev) => [...prev, ...picked]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Append tab handlers
  const removeAppendAt = (idx: number) => {
    setAppendFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const onAppendFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;
    setAppendFiles((prev) => [...prev, ...picked]);
    if (appendFileInputRef.current) appendFileInputRef.current.value = "";
  };

  // Reference image handlers for Generate tab
  const removeReferenceAt = (idx: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const onReferenceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;

    // Validate file types
    const validTypes = ['image/jpeg', 'image/png'];
    const invalidFiles = picked.filter(f => !validTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file type",
        description: "Only JPEG and PNG images are allowed",
        variant: "destructive"
      });
      if (referenceInputRef.current) referenceInputRef.current.value = "";
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = picked.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: "Each image must be less than 10MB",
        variant: "destructive"
      });
      if (referenceInputRef.current) referenceInputRef.current.value = "";
      return;
    }

    setReferenceImages((prev) => {
      const newTotal = prev.length + picked.length;
      if (newTotal > 3) {
        toast({
          title: "Too many images",
          description: "Maximum 3 reference images allowed",
          variant: "destructive"
        });
        return prev;
      }
      return [...prev, ...picked];
    });

    if (referenceInputRef.current) referenceInputRef.current.value = "";
  };

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
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

  const onAppendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAppend) return;
    try {
      setAppendLoading(true);
      const fd = new FormData();
      for (const f of appendFiles) fd.append("files", f);
      fd.append("prompt_id", appendPromptId.trim());
      if (appendTitle.trim()) fd.append("title", appendTitle.trim());
      const res = await fetch("/api/templates/append", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      toast({
        title: "Images Appended",
        description: `Added ${data.items?.length || 0} images to prompt ${data.promptId}.`,
      });

      // Refresh the templates list to show newly uploaded images
      const refreshRes = await fetch(`/api/templates?mode=by-prompt&prompt_id=${appendPromptId.trim()}`);
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setExistingTemplates(refreshData.items || []);
      }

      // reset file selection but keep prompt ID
      setAppendFiles([]);
      setAppendTitle("");
      if (appendFileInputRef.current) appendFileInputRef.current.value = "";
    } catch (e: any) {
      toast({ title: "Append failed", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setAppendLoading(false);
    }
  };

  const handleSetFeatured = async (templateId: string) => {
    try {
      const res = await fetch(`/api/templates/${templateId}/set-featured`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      await res.json();

      toast({
        title: "Display Image Set",
        description: "This image is now the display image for this prompt.",
      });

      setFeaturedTemplateId(templateId);

      // Refresh the templates list to show updated usage
      const refreshRes = await fetch(`/api/templates?mode=by-prompt&prompt_id=${appendPromptId.trim()}`);
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setExistingTemplates(refreshData.items || []);
      }
    } catch (e: any) {
      toast({ title: "Failed to set display image", description: e?.message || String(e), variant: "destructive" });
    }
  };

  const handleDeleteTemplate = async (templateId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent triggering the parent onClick (set featured)

    if (!confirm("Are you sure you want to delete this image? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/templates/${templateId}/delete`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      toast({
        title: "Image Deleted",
        description: `Successfully deleted the image and ${data.deletedFiles || 0} files from storage.`,
      });

      // Update local state to remove the deleted template
      setExistingTemplates(prev => prev.filter(t => t.id !== templateId));

      // If the deleted template was the featured one, clear the featured state
      if (featuredTemplateId === templateId) {
        setFeaturedTemplateId(null);
      }
    } catch (e: any) {
      toast({ title: "Failed to delete image", description: e?.message || String(e), variant: "destructive" });
    }
  };

  const onGenerate = async () => {
    if (!isGeneratePromptValid) return;
    try {
      setGenerating(true);
      setGeneratedImage(null);

      // Convert reference images to Base64 if any
      let imageData: string[] | undefined;
      if (referenceImages.length > 0) {
        try {
          imageData = await Promise.all(
            referenceImages.map(file => fileToBase64(file))
          );
        } catch (error) {
          throw new Error("Failed to process reference images");
        }
      }

      const requestBody: any = {
        prompt: generatePrompt.trim(),
      };

      // Add image data if reference images exist
      if (imageData && imageData.length > 0) {
        requestBody.image = imageData;
      }

      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to generate image");
      }

      const data = await res.json();

      if (data.data && data.data.length > 0) {
        setGeneratedImage({
          url: data.data[0].url,
          size: data.data[0].size,
        });
        toast({
          title: "Image Generated",
          description: `Successfully generated image (${data.data[0].size})`
        });
      } else {
        throw new Error("No image data returned");
      }
    } catch (e: any) {
      toast({
        title: "Generation failed",
        description: e?.message || String(e),
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;

    try {
      // 直接使用链接下载，避免 CORS 问题
      const a = document.createElement("a");
      a.href = generatedImage.url;
      a.download = `generated-${Date.now()}.jpg`;
      a.target = "_blank"; // 在新标签页打开，浏览器会自动下载
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({ title: "Download started", description: "Image download has been initiated" });
    } catch (e: any) {
      toast({
        title: "Download failed",
        description: e?.message || String(e),
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <h1 className="text-xl font-semibold mb-4">Admin Templates</h1>
      <div className="mb-4">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-xs">
          开发模式 DEV
        </span>
        <span className="ml-2 text-xs text-muted-foreground">仅用于开发调试，生产环境已隐藏</span>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="append">Append</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload">
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
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Available placeholder:</span>
            <code
              className="px-2 py-1 bg-muted rounded cursor-pointer hover:bg-muted/80 transition-colors select-all"
              onClick={(e) => {
                const text = e.currentTarget.textContent || "";
                navigator.clipboard.writeText(text);
                toast({ title: "Copied!", description: "Placeholder copied to clipboard" });
              }}
              title="Click to copy"
            >
              {`{{pet_by_breed}}`}
            </code>
          </div>
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5} placeholder="Describe the template prompt..." />
        </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={!canSubmit || loading}>
                {loading ? "Uploading..." : "Upload Templates"}
              </Button>
              {!canSubmit && <span className="text-sm text-muted-foreground">Select images and enter prompt to enable</span>}
            </div>
          </form>
        </TabsContent>

        {/* Append Tab */}
        <TabsContent value="append">
          <form onSubmit={onAppendSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Prompt ID (Required)</Label>
              <Input
                value={appendPromptId}
                onChange={(e) => setAppendPromptId(e.target.value)}
                placeholder="Enter the existing prompt UUID"
              />
              <p className="text-xs text-muted-foreground">
                Enter the UUID of an existing prompt to append images to it. You can find prompt IDs in the database or from previous uploads.
              </p>
            </div>

            {/* Existing Templates Display */}
            {loadingTemplates && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading templates...</span>
              </div>
            )}

            {existingTemplates.length > 0 && (
              <div className="space-y-2">
                <Label>Existing Images ({existingTemplates.length})</Label>
                <p className="text-xs text-muted-foreground">
                  Click an image to set it as the display image. Click the trash icon to delete an image.
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-96 overflow-y-auto border rounded-md p-3">
                  {existingTemplates.map((template: any) => {
                    const isFeatured = template.id === featuredTemplateId;
                    const imageUrl = getImageUrl(template.publicUrls, 'md', true);

                    return (
                      <div
                        key={template.id}
                        className={`relative group rounded-md overflow-hidden border-2 transition-all ${
                          isFeatured ? 'border-green-500 ring-2 ring-green-200' : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <div
                          className="aspect-square relative cursor-pointer"
                          onClick={() => handleSetFeatured(template.id)}
                        >
                          <Image
                            src={imageUrl}
                            alt={template.title || 'Template'}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 33vw, 25vw"
                          />
                          {isFeatured && (
                            <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-1 z-10">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTemplate(template.id, e)}
                            className="absolute top-1 left-1 z-20 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:scale-110"
                            aria-label="Delete image"
                            title="Delete this image"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1 pointer-events-none">
                          <p className="text-xs text-white truncate">
                            Usage: {template.usage}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Additional Images (支持多选)</Label>
              <input
                ref={appendFileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={onAppendFileChange}
              />
              {appendPreviews.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {appendPreviews.map((src, i) => (
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
                        onClick={() => removeAppendAt(i)}
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
              <Input
                value={appendTitle}
                onChange={(e) => setAppendTitle(e.target.value)}
                placeholder="e.g. Christmas Puppy"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={!canAppend || appendLoading}>
                {appendLoading ? "Appending..." : "Append Images"}
              </Button>
              {!canAppend && (
                <span className="text-sm text-muted-foreground">
                  Enter prompt ID and select images to enable
                </span>
              )}
            </div>
          </form>
        </TabsContent>

        {/* Generate Tab */}
        <TabsContent value="generate">
          <div className="space-y-4">
            {/* Reference Images Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Reference Images (Optional, max 3)</Label>
                <span className="text-xs text-muted-foreground">
                  {referenceImages.length}/3 images selected
                </span>
              </div>
              <input
                ref={referenceInputRef}
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onChange={onReferenceImageChange}
                disabled={referenceImages.length >= 3}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Upload reference images to guide the generation style. Supports JPEG and PNG (max 10MB each).
              </p>
              {referencePreviews.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {referencePreviews.map((src, i) => (
                    <div key={i} className="relative h-20 w-20">
                      <Image
                        src={src}
                        alt={`reference-${i}`}
                        width={80}
                        height={80}
                        className="h-20 w-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeReferenceAt(i)}
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

            {/* Prompt Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="generate-prompt">Image Generation Prompt</Label>
                <span className={`text-xs ${
                  generateCharCount.chineseChars > 300 || generateCharCount.englishWords > 600
                    ? "text-red-500 font-semibold"
                    : "text-muted-foreground"
                }`}>
                  {generateCharCount.total} characters
                  {generateCharCount.chineseChars > 0 && ` (${generateCharCount.chineseChars} 中文)`}
                  {generateCharCount.englishWords > 0 && ` (${generateCharCount.englishWords} words)`}
                </span>
              </div>
              <Textarea
                id="generate-prompt"
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                rows={6}
                placeholder="Enter your image generation prompt here... (Max: 300 Chinese characters or 600 English words)"
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: Keep prompts under 300 Chinese characters or 600 English words for best results.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Button
                  onClick={onGenerate}
                  disabled={!isGeneratePromptValid || generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Image"
                  )}
                </Button>
                {!isGeneratePromptValid && (
                  <span className="text-sm text-muted-foreground">
                    Please enter a prompt
                  </span>
                )}
              </div>
              {isPromptTooLong && (
                <div className="text-sm text-amber-600 flex items-start gap-2">
                  <span className="text-base">⚠️</span>
                  <span>
                    Warning: Prompt exceeds recommended limit (300 Chinese characters or 600 English words).
                    This may affect generation quality or fail.
                  </span>
                </div>
              )}
            </div>

            {/* Generated Image Display */}
            {generatedImage && (
              <div className="mt-6 space-y-4">
                <div className="border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Generated Image</h3>
                    <span className="text-xs text-muted-foreground">Size: {generatedImage.size}</span>
                  </div>
                  <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
                    {/* Using regular img tag to avoid Next.js image configuration issues */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={generatedImage.url}
                      alt="Generated image"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <Button onClick={downloadImage} variant="default" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download Image
                    </Button>
                    <a
                      href={generatedImage.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-center text-blue-600 hover:text-blue-800 underline"
                    >
                      Or click here to open image in new tab
                    </a>
                  </div>
                  <p className="mt-2 text-xs text-amber-600">
                    ⚠️ Note: Image URL is valid for 24 hours. Please download to save permanently.
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

