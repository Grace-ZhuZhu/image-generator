"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

import { Card } from "@/components/ui/card";


import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Share2, Zap, Flame, RefreshCw, Download, X, Plus, Loader2 } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { Template } from "@/types/templates";

const THEMES = [
  { key: "all", label: "全部" },
  { key: "holiday", label: "节日 🎄" },
  { key: "career", label: "职业 👔" },
  { key: "fantasy", label: "奇幻 🦄" },
  { key: "fashion", label: "时尚 👗" },
  { key: "art", label: "艺术 🎨" },
] as const;



// i18n moved to lib/i18n

// Pet/Breed dropdowns and prompt variable logic
const OTHER = "Other-不在此列表中" as const;
const PETS = ["cat", "dog", "rabbit", OTHER] as const;
const BREEDS: Record<string, string[]> = {
  cat: ["British Shorthair", "Siamese", "Persian", "Ragdoll"],
  dog: ["poodle", "shiba", "golden retriever", "husky"],
  rabbit: [],
};

function computePetByBreed(pet?: string, breed?: string) {
  if (!pet || pet === OTHER) return "宠物";
  if ((pet === "cat" || pet === "dog") && breed && breed !== OTHER) return `${breed} ${pet}`;
  return pet;
}

function renderTemplateWithPetByBreed(tpl: string, pet_by_breed: string) {
  return tpl.replace(/\{\{\s*pet_by_breed\s*\}\}/g, pet_by_breed ?? "");
}

import { useI18n } from "@/lib/i18n/index";


export default function HomePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<(typeof THEMES)[number]["key"]>("all");
  const [selected, setSelected] = useState<Template | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState<"normal" | "2k" | "4k">("normal");

  // Pet & Breed selections (for {{pet_by_breed}})
  const [pet, setPet] = useState<string>("cat");
  const [breed, setBreed] = useState<string>("");
  const isCatDog = pet === "cat" || pet === "dog";
  useEffect(() => {
    if (!isCatDog) setBreed("");
  }, [isCatDog]);
  const petByBreed = useMemo(() => computePetByBreed(pet, breed), [pet, breed]);

  const { L } = useI18n();

  // Templates data from API
  const [templates, setTemplates] = useState<Template[]>([]);
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const [themeTemplates, setThemeTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingThemeTemplates, setLoadingThemeTemplates] = useState(false);

  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  // Fetch representative templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const res = await fetch("/api/templates?mode=representatives");
        if (!res.ok) throw new Error("Failed to fetch templates");
        const data = await res.json();
        setTemplates(data.items || []);
      } catch (e: any) {
        console.error("Failed to load templates:", e);
        toast({ title: "加载失败", description: "无法加载模板图片" });
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, [toast]);

  // Fetch all templates for a specific theme when expanded
  useEffect(() => {
    if (!expandedTheme) {
      setThemeTemplates([]);
      return;
    }
    const fetchThemeTemplates = async () => {
      try {
        setLoadingThemeTemplates(true);
        const res = await fetch(`/api/templates?mode=by-theme&theme=${expandedTheme}`);
        if (!res.ok) throw new Error("Failed to fetch theme templates");
        const data = await res.json();
        setThemeTemplates(data.items || []);
      } catch (e: any) {
        console.error("Failed to load theme templates:", e);
        toast({ title: "加载失败", description: "无法加载主题图片" });
      } finally {
        setLoadingThemeTemplates(false);
      }
    };
    fetchThemeTemplates();
  }, [expandedTheme, toast]);

  const filtered = useMemo(() => {
    if (expandedTheme) return themeTemplates;
    return theme === "all" ? templates : templates.filter((t) => t.theme === theme);
  }, [theme, templates, expandedTheme, themeTemplates]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;
    setFiles((prev) => [...prev, ...picked].slice(0, 3));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFileAt = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTemplateClick = async (template: Template) => {
    // First level: expand theme to show all templates
    setExpandedTheme(template.theme || "");
  };

  const handleTemplateSelect = async (template: Template) => {
    setSelected(template);
    setExpandedTheme(null); // Close expanded view
    // Increment usage count
    try {
      await fetch(`/api/templates/${template.id}/increment-usage`, { method: "POST" });
    } catch (e) {
      console.error("Failed to increment usage:", e);
    }
  };

  const handleGenerate = () => {
    if (!user) return router.push("/sign-up");
    if (!selected) {
      toast({ title: L.ui.toastSelectTitle, description: L.ui.toastSelectDesc });
      return;
    }
    if (files.length === 0) {
      toast({ title: L.ui.toastUploadTitle, description: L.ui.toastUploadDesc });
      return;
    }
    setIsLoading(true);
    // TODO: Implement actual generation with petByBreed
    const finalPrompt = renderTemplateWithPetByBreed(selected.prompt, petByBreed);
    console.log("Generating with prompt:", finalPrompt);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* 悬浮操作栏：移到主菜单（Header）下方，固定在顶部 */}
      <div className="fixed inset-x-0 top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="container mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-3">
              {files.length > 0 && previews.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto">
                  {previews.map((src, i) => (
                    <div key={i} className="relative h-10 w-10">
                      <img
                        src={src}
                        alt={`preview-${i}`}
                        className="h-10 w-10 rounded-md object-cover border"
                      />
                      <button
                        type="button"
                        aria-label="Remove"
                        onClick={() => removeFileAt(i)}
                        className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full border bg-background text-muted-foreground hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  id="pet-files"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={onFileChange}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 w-10 rounded-md border border-dashed flex items-center justify-center text-muted-foreground hover:bg-muted/50"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <div className="text-sm text-muted-foreground">{L.ui.uploadLabel}</div>
                <div className="text-xs text-muted-foreground">{L.ui.max3}</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Pet & Breed selects */}
              <div className="flex items-center gap-2">
                <div className="w-36">
                  <Select value={pet} onValueChange={(v) => setPet(v)}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="宠物" />
                    </SelectTrigger>
                    <SelectContent>
                      {PETS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {isCatDog && (
                  <div className="w-44">
                    <Select value={breed} onValueChange={setBreed}>
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="品种" />
                      </SelectTrigger>
                      <SelectContent>
                        {BREEDS[pet].map((b) => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                        <SelectItem value={OTHER}>{OTHER}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <RadioGroup
                value={quality}
                onValueChange={(v) => setQuality(v as any)}
                className="grid grid-cols-3 gap-3"
              >
                <label className="flex items-center gap-2 rounded-md border p-2">
                  <RadioGroupItem value="normal" id="q1-top" />
                  <span className="text-sm">{L.quality.normal}</span>
                </label>
                <label className="flex items-center gap-2 rounded-md border p-2">
                  <RadioGroupItem value="2k" id="q2-top" />
                  <span className="text-sm">{L.quality.q2k}</span>
                </label>
                <label className="flex items-center gap-2 rounded-md border p-2">
                  <RadioGroupItem value="4k" id="q3-top" />
                  <span className="text-sm">{L.quality.q4k}</span>
                </label>
              </RadioGroup>

              <Button
                onClick={handleGenerate}
                disabled={isLoading}
                className="whitespace-nowrap"
                title={renderTemplateWithPetByBreed("A high-quality portrait of a {{pet_by_breed}} in studio lighting.", petByBreed)}
              >
                <Zap className="mr-2 h-4 w-4" /> {isLoading ? L.actions.generating : L.actions.start}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 顶部悬浮操作栏占位，避免覆盖内容 */}
      <div className="h-20" />

      {/* Hero Section - 保留 */}
      <section className="relative overflow-hidden py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6"
          >
            <div className="space-y-3">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {L.hero.title}
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {L.hero.desc}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 主布局：左侧瀑布流 + 右侧结果面板 */}
      <section className="container mx-auto max-w-6xl px-4 pb-40">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左：主题与参考图 */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <Tabs value={theme} onValueChange={(v) => setTheme(v as any)}>
                <TabsList className="flex w-full flex-wrap gap-2">
                  {THEMES.map((t) => (
                    <TabsTrigger key={t.key} value={t.key} className="data-[state=active]:bg-primary/10">
                      {L.themes[t.key as string]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

            </div>

            <div className="mt-4">
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : selected ? (
                <Card className="relative p-6">
                  <button
                    aria-label="Close"
                    onClick={() => setSelected(null)}
                    className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted/50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="aspect-square w-full overflow-hidden rounded-md">
                    <img
                      src={selected.publicUrls?.lg || ""}
                      alt={selected.title || "Selected template"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                    <span>🔥{selected.usage}</span>
                  </div>
                  {selected.title && <div className="mt-2 text-sm font-medium">{selected.title}</div>}
                </Card>
              ) : (
                <>
                  {expandedTheme && (
                    <div className="mb-4 flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setExpandedTheme(null)}>
                        ← 返回
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {THEMES.find((t) => t.key === expandedTheme)?.label || expandedTheme}
                      </span>
                    </div>
                  )}
                  {loadingThemeTemplates ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {filtered.map((item) => (
                        <Dialog key={item.id}>
                          <DialogTrigger asChild>
                            <Card
                              onClick={() => (expandedTheme ? handleTemplateSelect(item) : handleTemplateClick(item))}
                              className="cursor-pointer overflow-hidden transition hover:shadow-md"
                            >
                              <div className="aspect-square w-full overflow-hidden">
                                <img
                                  src={item.publicUrls?.md || ""}
                                  alt={item.title || "Template"}
                                  className="h-full w-full object-cover transition hover:scale-105"
                                />
                              </div>
                              <div className="p-3">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                                  <span>{item.usage}</span>
                                </div>
                                {item.title && <div className="mt-1 text-sm font-medium line-clamp-1">{item.title}</div>}
                              </div>
                            </Card>
                          </DialogTrigger>
                          {expandedTheme && (
                            <DialogContent className="max-w-4xl">
                              <div className="aspect-square w-full overflow-hidden rounded-md">
                                <img
                                  src={item.publicUrls?.orig || item.publicUrls?.lg || ""}
                                  alt={item.title || "Template"}
                                  className="h-full w-full object-contain"
                                />
                              </div>
                              <div className="mt-4 space-y-2">
                                {item.title && <h3 className="text-lg font-semibold">{item.title}</h3>}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Flame className="h-4 w-4 text-orange-500" />
                                  <span>使用次数: {item.usage}</span>
                                </div>
                                <Button onClick={() => handleTemplateSelect(item)} className="w-full">
                                  选择此模板
                                </Button>
                              </div>
                            </DialogContent>
                          )}
                        </Dialog>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 右：结果面板与历史 */}
          <div className="lg:sticky lg:top-20 h-fit space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{L.ui.current}</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"><Download className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm"><RefreshCw className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm"><Share2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="aspect-square w-full rounded-md border bg-muted/30 flex items-center justify-center text-muted-foreground">
                {isLoading ? L.ui.generating : L.ui.placeholder}
              </div>
            </Card>

            <Card className="p-4">
              <div className="mb-3 font-semibold">{L.ui.history}</div>
              <div className="flex gap-3 overflow-x-auto">
                {[1, 2, 3, 4, 5].map((k) => (
                  <div key={k} className="min-w-20 h-20 rounded-md border bg-muted/30" />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>


    </div>
  );
}
