"use client";

import { Button } from "@/components/ui/button";
import { X, PanelRight, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResultsViewMode } from "@/types/generated-images";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ResultsViewToggleProps {
  currentMode: ResultsViewMode;
  onModeChange: (mode: ResultsViewMode) => void;
  className?: string;
}

export function ResultsViewToggle({
  currentMode,
  onModeChange,
  className,
}: ResultsViewToggleProps) {
  const modes: Array<{
    value: ResultsViewMode;
    icon: React.ReactNode;
    label: string;
    description: string;
  }> = [
    {
      value: "hidden",
      icon: <X className="h-4 w-4" />,
      label: "隐藏",
      description: "隐藏结果面板",
    },
    {
      value: "sidebar",
      icon: <PanelRight className="h-4 w-4" />,
      label: "侧边栏",
      description: "侧边栏模式 (400px)",
    },
    {
      value: "expanded",
      icon: <Maximize2 className="h-4 w-4" />,
      label: "展开",
      description: "展开历史网格",
    },
  ];

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1 bg-muted/50 rounded-md p-1", className)}>
        {modes.map((mode) => (
          <Tooltip key={mode.value}>
            <TooltipTrigger asChild>
              <Button
                variant={currentMode === mode.value ? "default" : "ghost"}
                size="sm"
                onClick={() => onModeChange(mode.value)}
                className={cn(
                  "h-8 px-3 transition-all",
                  currentMode === mode.value && "shadow-sm"
                )}
              >
                {mode.icon}
                <span className="ml-2 text-xs">{mode.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{mode.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

