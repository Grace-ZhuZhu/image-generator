"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Download, ZoomIn, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GeneratedImage } from "@/types/generated-images";
import { cn } from "@/lib/utils";

interface HistoryGridViewProps {
  images: GeneratedImage[];
  onImageClick?: (image: GeneratedImage) => void;
  className?: string;
}

export function HistoryGridView({ images, onImageClick, className }: HistoryGridViewProps) {
  const [viewingImage, setViewingImage] = useState<GeneratedImage | null>(null);

  const handleImageClick = (image: GeneratedImage) => {
    setViewingImage(image);
    onImageClick?.(image);
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (images.length === 0) {
    return (
      <div className={cn("h-full flex items-center justify-center text-muted-foreground p-8", className)}>
        <div className="text-center space-y-3">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-sm font-medium">暂无生成历史</p>
          <p className="text-xs text-muted-foreground/70">
            选择模板并上传照片，点击生成按钮开始创作
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("h-full overflow-y-auto", className)}>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              生成历史
            </h3>
            <span className="text-xs text-muted-foreground">
              共 {images.length} 张
            </span>
          </div>

          {/* 网格布局 - 类似主页瀑布流 */}
          <div className="columns-2 gap-3 space-y-3">
            {images.map((image) => (
              <Card
                key={image.id}
                className="cursor-pointer overflow-hidden break-inside-avoid hover:shadow-lg transition-all hover:scale-[1.02]"
                onClick={() => handleImageClick(image)}
              >
                <div className="relative group">
                  <Image
                    src={image.url}
                    alt={image.prompt}
                    width={300}
                    height={300}
                    className="w-full h-auto object-cover"
                  />

                  {/* Hover 遮罩 */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {image.prompt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium">{image.size}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(image.created_at).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* 大图查看 Dialog */}
      {viewingImage && (
        <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogTitle className="sr-only">查看生成图片</DialogTitle>
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-muted">
                <Image
                  src={viewingImage.url}
                  alt={viewingImage.prompt}
                  width={1024}
                  height={1024}
                  className="w-full h-auto"
                />
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">提示词</p>
                  <p className="text-sm text-muted-foreground">{viewingImage.prompt}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>尺寸: {viewingImage.size}</span>
                  <span>质量: {viewingImage.quality}</span>
                  <span>
                    {new Date(viewingImage.created_at).toLocaleString("zh-CN")}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleDownload(
                        viewingImage.url,
                        `generated-${viewingImage.id}.png`
                      )
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    下载图片
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

