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
import { Share2, Zap, Flame, RefreshCw, Download, X, Plus } from "lucide-react";

type RefItem = { id: string; emoji: string; title: string; usage: number; theme: string };

const THEMES = [
  { key: "all", label: "全部" },
  { key: "holiday", label: "节日 🎄" },
  { key: "career", label: "职业 👔" },
  { key: "fantasy", label: "奇幻 🦄" },
  { key: "fashion", label: "时尚 👗" },
  { key: "art", label: "艺术 🎨" },
] as const;

const MOCK_ITEMS: RefItem[] = [
  { id: "x1", emoji: "🎅", title: "圣诞狗狗", usage: 999, theme: "holiday" },
  { id: "x2", emoji: "👮", title: "警察猫咪", usage: 888, theme: "career" },
  { id: "x3", emoji: "🦸", title: "超级英雄", usage: 777, theme: "fantasy" },
  { id: "x4", emoji: "👗", title: "时尚猫", usage: 666, theme: "fashion" },
  { id: "x5", emoji: "🎨", title: "油画风", usage: 555, theme: "art" },
  { id: "x6", emoji: "🎃", title: "万圣节猫", usage: 444, theme: "holiday" },
  { id: "x7", emoji: "🍔", title: "厨师狗", usage: 333, theme: "career" },
  { id: "x8", emoji: "🏰", title: "公主猫", usage: 222, theme: "fantasy" },
  { id: "x9", emoji: "💎", title: "奢华风", usage: 111, theme: "fashion" },
];

// i18n moved to lib/i18n
import { useI18n } from "@/lib/i18n/index";


export default function HomePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<(typeof THEMES)[number]["key"]>("all");
  const [selected, setSelected] = useState<RefItem | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState<"normal" | "2k" | "4k">("normal");
  const { L } = useI18n();


  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);


  const filtered = useMemo(
    () => (theme === "all" ? MOCK_ITEMS : MOCK_ITEMS.filter((i) => i.theme === theme)),
    [theme]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;
    setFiles((prev) => [...prev, ...picked].slice(0, 3));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFileAt = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
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

              <Button onClick={handleGenerate} disabled={isLoading} className="whitespace-nowrap">
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
              {selected ? (
                <Card className="relative p-6">
                  <button
                    aria-label="Close"
                    onClick={() => setSelected(null)}
                    className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted/50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="aspect-square w-full flex items-center justify-center text-9xl">
                    {selected.emoji}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                    <span>🔥{selected.usage}</span>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filtered.map((item) => (
                    <Card
                      key={item.id}
                      onClick={() => setSelected(item)}
                      className="cursor-pointer p-4 transition hover:shadow-md"
                    >
                      <div className="text-4xl">{item.emoji}</div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Flame className="h-3.5 w-3.5 text-orange-500" />
                          <span>🔥{item.usage}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
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
