"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import ResponsiveImage from "@/components/ResponsiveImage";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { getImageUrlWithFallback } from "@/utils/image-url-helper";

import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Share2, Zap, Flame, RefreshCw, Download, X, Plus, Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Template } from "@/types/templates";

const THEMES = [
  { key: "all", label: "全部" },
  { key: "holiday", label: "节日 🎄" },
  { key: "career", label: "职业 👔" },
  { key: "fantasy", label: "奇幻 🦄" },
  { key: "fashion", label: "时尚 👗" },
  { key: "art", label: "艺术 🎨" },
  { key: "studio", label: "工作室 📸" },
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

  // Templates data from API - Three-level structure:
  // Level 1: Representatives (one per prompt) - paginated
  // Level 2: By prompt (all images for a prompt) - not paginated
  const [templates, setTemplates] = useState<Template[]>([]);
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null);
  const [promptTemplates, setPromptTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingPromptTemplates, setLoadingPromptTemplates] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Image zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewingImage, setViewingImage] = useState<Template | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Dialog image loading state and error handling
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageRetryCount, setImageRetryCount] = useState(0);
  const imageRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  // Fetch representative templates (one per prompt) when theme or page changes
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const url = `/api/templates?mode=representatives&theme=${theme}&page=${currentPage}&limit=50`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch templates");
        const data = await res.json();
        setTemplates(data.items || []);
        setTotalItems(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / 50));
      } catch (e: any) {
        console.error("Failed to load templates:", e);
        toast({ title: "加载失败", description: "无法加载模板图片" });
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, [theme, currentPage, toast]);

  // Reset to page 1 when theme changes
  useEffect(() => {
    setCurrentPage(1);
    setExpandedPromptId(null);
  }, [theme]);

  // Fetch all templates for a specific prompt when expanded
  useEffect(() => {
    if (!expandedPromptId) {
      setPromptTemplates([]);
      return;
    }
    const fetchPromptTemplates = async () => {
      try {
        setLoadingPromptTemplates(true);
        const res = await fetch(`/api/templates?mode=by-prompt&prompt_id=${expandedPromptId}`);
        if (!res.ok) throw new Error("Failed to fetch prompt templates");
        const data = await res.json();
        setPromptTemplates(data.items || []);
      } catch (e: any) {
        console.error("Failed to load prompt templates:", e);
        toast({ title: "加载失败", description: "无法加载提示词图片" });
      } finally {
        setLoadingPromptTemplates(false);
      }
    };
    fetchPromptTemplates();
  }, [expandedPromptId, toast]);

  const displayedTemplates = useMemo(() => {
    return expandedPromptId ? promptTemplates : templates;
  }, [expandedPromptId, promptTemplates, templates]);

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
    // Click on representative image: expand to show all images for this prompt
    setExpandedPromptId(template.prompt_id);
  };

  // Toggle checkbox selection - select/deselect the representative image of a prompt
  const handleCheckboxToggle = async (promptId: string, e?: React.MouseEvent) => {
    // Stop propagation to prevent card click
    if (e) {
      e.stopPropagation();
    }

    // Check if this prompt is already selected
    const isCurrentlySelected = selected?.prompt_id === promptId;

    if (isCurrentlySelected) {
      // Deselect
      setSelected(null);
    } else {
      // Select: find the representative image (highest usage) for this prompt
      let representative: Template | null = null;

      if (expandedPromptId === promptId) {
        // We're in the expanded view, use promptTemplates
        representative = promptTemplates.reduce((highest, current) =>
          (current.usage > highest.usage) ? current : highest
        );
      } else {
        // We're in the representatives view, find it in templates
        representative = templates.find(t => t.prompt_id === promptId) || null;
      }

      if (representative) {
        setSelected(representative);
        // Increment usage count
        try {
          await fetch(`/api/templates/${representative.id}/increment-usage`, { method: "POST" });
        } catch (e) {
          console.error("Failed to increment usage:", e);
        }
      }
    }
  };

  const handleImageClick = (template: Template) => {
    setViewingImage(template);
    setZoomLevel(1); // Reset zoom when opening
    setImageLoading(true); // Reset loading state
    setImageError(false); // Reset error state
    setImageRetryCount(0); // Reset retry count
    // Clear any pending retry timeout
    if (imageRetryTimeoutRef.current) {
      clearTimeout(imageRetryTimeoutRef.current);
      imageRetryTimeoutRef.current = null;
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 1));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  // Carousel navigation
  const handlePrevImage = () => {
    if (!viewingImage) return;

    // Get the current list of templates to navigate through
    const currentList = displayedTemplates;
    const currentIndex = currentList.findIndex(t => t.id === viewingImage.id);

    if (currentIndex > 0) {
      const prevTemplate = currentList[currentIndex - 1];
      setViewingImage(prevTemplate);
      setZoomLevel(1); // Reset zoom when changing image
      setImageLoading(true); // Reset loading state
      setImageError(false); // Reset error state
      setImageRetryCount(0); // Reset retry count
      // Clear any pending retry timeout
      if (imageRetryTimeoutRef.current) {
        clearTimeout(imageRetryTimeoutRef.current);
        imageRetryTimeoutRef.current = null;
      }
    }
  };

  const handleNextImage = () => {
    if (!viewingImage) return;

    // Get the current list of templates to navigate through
    const currentList = displayedTemplates;
    const currentIndex = currentList.findIndex(t => t.id === viewingImage.id);

    if (currentIndex < currentList.length - 1) {
      const nextTemplate = currentList[currentIndex + 1];
      setViewingImage(nextTemplate);
      setZoomLevel(1); // Reset zoom when changing image
      setImageLoading(true); // Reset loading state
      setImageError(false); // Reset error state
      setImageRetryCount(0); // Reset retry count
      // Clear any pending retry timeout
      if (imageRetryTimeoutRef.current) {
        clearTimeout(imageRetryTimeoutRef.current);
        imageRetryTimeoutRef.current = null;
      }
    }
  };

  // Get current position in carousel
  const getCarouselPosition = () => {
    if (!viewingImage) return { current: 0, total: 0 };
    const currentList = displayedTemplates;
    const currentIndex = currentList.findIndex((t: any) => t.id === viewingImage.id);
    return { current: currentIndex + 1, total: currentList.length };
  };

  // Preload adjacent images for faster carousel navigation
  useEffect(() => {
    if (!viewingImage) return;

    const currentList = displayedTemplates;
    const currentIndex = currentList.findIndex(t => t.id === viewingImage.id);
    const preloadedLinks: HTMLLinkElement[] = [];

    // Preload next image
    if (currentIndex < currentList.length - 1) {
      const nextImage = currentList[currentIndex + 1];
      const nextImageUrl = getImageUrlWithFallback(nextImage.publicUrls, ['orig', 'lg']);
      if (nextImageUrl) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = nextImageUrl;
        document.head.appendChild(link);
        preloadedLinks.push(link);
      }
    }

    // Preload previous image
    if (currentIndex > 0) {
      const prevImage = currentList[currentIndex - 1];
      const prevImageUrl = getImageUrlWithFallback(prevImage.publicUrls, ['orig', 'lg']);
      if (prevImageUrl) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = prevImageUrl;
        document.head.appendChild(link);
        preloadedLinks.push(link);
      }
    }

    // Cleanup: remove preload links when component unmounts or viewingImage changes
    return () => {
      preloadedLinks.forEach(link => {
        if (link.parentNode) {
          document.head.removeChild(link);
        }
      });
    };
  }, [viewingImage, displayedTemplates]);

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (imageRetryTimeoutRef.current) {
        clearTimeout(imageRetryTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!viewingImage) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevImage();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextImage();
      } else if (e.key === "Escape") {
        setViewingImage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewingImage, displayedTemplates]);

  // Reset zoom when dialog closes
  useEffect(() => {
    if (!viewingImage) {
      setZoomLevel(1);
    }
  }, [viewingImage]);

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
    const promptText = (selected as any).promptText || (selected as any).prompt?.prompt || "";
    const finalPrompt = renderTemplateWithPetByBreed(promptText, petByBreed);
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
              {/* Selected template display */}
              {selected && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-shrink-0 w-10 h-10">
                      <img
                        src={getImageUrlWithFallback(selected.publicUrls, ['sm', 'md'])}
                        alt={selected.title || "Template"}
                        crossOrigin="anonymous"
                        className="w-full h-full rounded object-cover border"
                      />
                      <button
                        type="button"
                        aria-label="Remove template"
                        onClick={() => setSelected(null)}
                        className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full border bg-background text-muted-foreground hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex flex-col min-w-[120px] max-w-[200px]">
                      <span className="text-xs text-muted-foreground">{L.ui.templateStyle}</span>
                      {selected.title && (
                        <span className="text-sm font-medium truncate" title={selected.title}>
                          {selected.title}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="self-stretch w-px bg-border" />
                </>
              )}

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
              {expandedPromptId && (
                <div className="mb-4 flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setExpandedPromptId(null)}>
                    ← {L.ui.back}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="prompt-checkbox"
                      checked={selected?.prompt_id === expandedPromptId}
                      onCheckedChange={() => handleCheckboxToggle(expandedPromptId)}
                    />
                    <label
                      htmlFor="prompt-checkbox"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {L.ui.useStyleAsTemplate}
                    </label>
                  </div>
                </div>
              )}

              {/* 画廊区域 - 始终显示，每个图片使用独立的 LazyImage 占位符 */}
              <TooltipProvider>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {/* 如果正在加载且没有数据，显示骨架屏卡片 */}
                          {(loadingTemplates || loadingPromptTemplates) && displayedTemplates.length === 0 ? (
                            Array.from({ length: 6 }).map((_, index) => (
                              <Card key={`skeleton-${index}`} className="overflow-hidden">
                                <div className="w-full aspect-square">
                                  <Skeleton className="w-full h-full" />
                                </div>
                                <div className="p-3 space-y-2">
                                  <Skeleton className="h-4 w-12" />
                                  <Skeleton className="h-4 w-full" />
                                </div>
                              </Card>
                            ))
                          ) : (
                            displayedTemplates.map((item, index) => (
                            <Card
                              key={item.id}
                              onClick={() => {
                                if (!expandedPromptId) {
                                  handleTemplateClick(item);
                                } else {
                                  handleImageClick(item);
                                }
                              }}
                              className="cursor-pointer overflow-hidden transition hover:shadow-md relative"
                            >
                              {/* Checkbox - only show in first layer (representatives view) */}
                              {!expandedPromptId && (
                                <div className="absolute top-2 right-2 z-10">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        onClick={(e) => handleCheckboxToggle(item.prompt_id, e)}
                                        className="bg-white/90 dark:bg-gray-800/90 rounded p-1 shadow-sm hover:bg-white dark:hover:bg-gray-800 transition"
                                      >
                                        <Checkbox
                                          checked={selected?.prompt_id === item.prompt_id}
                                          onCheckedChange={() => {}}
                                          className="pointer-events-none"
                                        />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{L.ui.useStyleAsTemplate}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              )}

                              <div className="w-full overflow-hidden">
                                <ResponsiveImage
                                  publicUrls={item.publicUrls}
                                  size="md"
                                  alt={item.title || "Template"}
                                  width={320}
                                  height={320}
                                  priority={index < 6}
                                  className="w-full h-auto object-contain transition hover:scale-105"
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
                          ))
                          )}
                        </div>

                      {/* Pagination controls - only show when not expanded */}
                      {!expandedPromptId && totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            上一页
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            第 {currentPage} / {totalPages} 页 (共 {totalItems} 个提示词)
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                          >
                            下一页
                          </Button>
                        </div>
                      )}

                      {/* Image viewer dialog */}
                      {viewingImage && (() => {
                        const { current, total } = getCarouselPosition();
                        const isFirst = current === 1;
                        const isLast = current === total;

                        return (
                          <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
                            <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 overflow-hidden bg-black/95 border-none [&>button]:text-white [&>button]:hover:bg-white/20">
                              {/* Hidden title for accessibility */}
                              <DialogTitle className="sr-only">
                                {viewingImage.title || "模板图片查看器"}
                              </DialogTitle>

                              {/* Zoom controls */}
                              <div className="absolute top-4 right-14 z-50 flex gap-2">
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  onClick={handleZoomOut}
                                  disabled={zoomLevel <= 1}
                                  className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white border-white/20 focus:outline-none focus-visible:ring-0"
                                >
                                  <ZoomOut className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  onClick={handleResetZoom}
                                  disabled={zoomLevel === 1}
                                  className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs border-white/20 focus:outline-none focus-visible:ring-0"
                                >
                                  1:1
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  onClick={handleZoomIn}
                                  disabled={zoomLevel >= 3}
                                  className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white border-white/20 focus:outline-none focus-visible:ring-0"
                                >
                                  <ZoomIn className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Left arrow */}
                              {!isFirst && (
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  onClick={handlePrevImage}
                                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white border-white/20 focus:outline-none focus-visible:ring-0"
                                >
                                  <ChevronLeft className="h-6 w-6" />
                                </Button>
                              )}

                              {/* Right arrow */}
                              {!isLast && (
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  onClick={handleNextImage}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white border-white/20 focus:outline-none focus-visible:ring-0"
                                >
                                  <ChevronRight className="h-6 w-6" />
                                </Button>
                              )}

                              {/* Image counter */}
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-full bg-black/60 text-white text-sm">
                                {current} / {total}
                              </div>

                              {/* Image container with scroll */}
                              <div
                                ref={imageContainerRef}
                                className="overflow-auto flex items-center justify-center relative"
                                style={{
                                  maxWidth: "95vw",
                                  maxHeight: "95vh"
                                }}
                              >
                                {/* Loading indicator */}
                                {imageLoading && !imageError && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
                                    <div className="flex flex-col items-center gap-3">
                                      <Loader2 className="h-10 w-10 animate-spin text-white" />
                                      <p className="text-white text-sm">加载中...</p>
                                    </div>
                                  </div>
                                )}

                                {/* Error state */}
                                {imageError ? (
                                  <div className="flex flex-col items-center justify-center gap-4 p-8 min-h-[400px]">
                                    <div className="text-white text-center space-y-2">
                                      <p className="text-lg font-medium">图片加载失败</p>
                                      <p className="text-sm text-white/70">
                                        {imageRetryCount > 0
                                          ? `已重试 ${imageRetryCount} 次，请检查网络连接或稍后重试`
                                          : '请检查网络连接或稍后重试'
                                        }
                                      </p>
                                    </div>
                                    <Button
                                      onClick={() => {
                                        console.log('[Dialog] Manual retry triggered');
                                        setImageError(false);
                                        setImageLoading(true);
                                        setImageRetryCount(0);
                                        // Clear any pending retry timeout
                                        if (imageRetryTimeoutRef.current) {
                                          clearTimeout(imageRetryTimeoutRef.current);
                                          imageRetryTimeoutRef.current = null;
                                        }
                                      }}
                                      className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                                    >
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      重试
                                    </Button>
                                  </div>
                                ) : (
                                  (() => {
                                    // 获取图片 URL（支持新旧格式）
                                    const getImageUrls = () => {
                                      const urls = viewingImage.publicUrls;
                                      if (!urls) return { webp: '', jpg: '' };

                                      // 优先使用 orig，回退到 lg
                                      for (const size of ['orig', 'lg'] as const) {
                                        const sizeUrls = urls[size];
                                        if (!sizeUrls) continue;

                                        // 新格式
                                        if (typeof sizeUrls === 'object' && 'jpg' in sizeUrls && 'webp' in sizeUrls) {
                                          return { webp: sizeUrls.webp || '', jpg: sizeUrls.jpg || '' };
                                        }

                                        // 旧格式
                                        if (typeof sizeUrls === 'string') {
                                          return { webp: '', jpg: sizeUrls };
                                        }
                                      }

                                      return { webp: '', jpg: '' };
                                    };

                                    const { webp, jpg } = getImageUrls();

                                    const handleImageError = () => {
                                      console.error(`[Dialog] Image load error, retry count: ${imageRetryCount}`);

                                      const maxRetries = 3;

                                      // 如果还有重试次数，自动重试（指数退避）
                                      if (imageRetryCount < maxRetries) {
                                        const delay = 1000 * Math.pow(2, imageRetryCount); // 1s, 2s, 4s
                                        console.log(`[Dialog] Retrying in ${delay}ms...`);

                                        imageRetryTimeoutRef.current = setTimeout(() => {
                                          setImageRetryCount(prev => prev + 1);
                                          setImageLoading(true);
                                          setImageError(false);
                                        }, delay);
                                      } else {
                                        // 重试次数用尽，显示错误状态
                                        console.error(`[Dialog] Max retries (${maxRetries}) reached`);
                                        setImageLoading(false);
                                        setImageError(true);
                                      }
                                    };

                                    return (
                                      <picture key={imageRetryCount}>
                                        {webp && <source srcSet={`${webp}?retry=${imageRetryCount}`} type="image/webp" />}
                                        <img
                                          src={`${jpg}?retry=${imageRetryCount}`}
                                          alt={viewingImage.title || "Template"}
                                          width={1920}
                                          height={1920}
                                          loading="eager"
                                          crossOrigin="anonymous"
                                          onLoad={() => {
                                            setImageLoading(false);
                                            setImageError(false);
                                          }}
                                          onError={handleImageError}
                                          className="max-w-[95vw] max-h-[95vh] w-auto h-auto object-contain transition-all duration-300"
                                          style={{
                                            transform: `scale(${zoomLevel})`,
                                            transformOrigin: "center center",
                                            opacity: imageLoading ? 0 : 1
                                          }}
                                        />
                                      </picture>
                                    );
                                  })()
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        );
                      })()}
              </TooltipProvider>
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
