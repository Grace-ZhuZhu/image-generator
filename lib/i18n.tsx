"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "zh";

export const I18N = {
  en: {
    hero: {
      title: "Transform Your Pet Into Art",
      desc:
        "Upload your pet's photo, choose a reference style and quality, and get a professional result in ~10s.",
    },
    themes: {
      all: "All",
      holiday: "Holiday \ud83c\udf84",
      career: "Career \ud83d\udc54",
      fantasy: "Fantasy \ud83e\udd84",
      fashion: "Fashion \ud83d\udc57",
      art: "Art \ud83c\udfa8",
    } as Record<string, string>,
    ui: {
      current: "Current Result",
      history: "History",
      generating: "\ud83d\udc15 Generating… \u23f3",
      placeholder: "Select a style and upload photos to see results here",
      selected: "Selected",
      selectedRef: "Selected style:",
      none: "None",
      uploadLabel: "Upload your pet photos",
      max3: "Up to 3",
      language: "Language",
      toastSelectTitle: "Please select a reference style",
      toastSelectDesc: "Click a card on the left to choose a style",
      toastUploadTitle: "Please upload pet photos",
      toastUploadDesc: "Up to 3 files, JPEG/PNG/WebP",
    },
    quality: {
      normal: "Standard (100\ud83d\udc8e)",
      q2k: "2K (300\ud83d\udc8e)",
      q4k: "4K (500\ud83d\udc8e)",
    },
    actions: {
      start: "Generate",
      generating: "Generating…",
    },
  },
  zh: {
    hero: {
      title: "Transform Your Pet Into Art",
      desc: "上传宠物照片，选择参考风格与清晰度，10秒生成专业级艺术照片。",
    },
    themes: {
      all: "全部",
      holiday: "节日 \ud83c\udf84",
      career: "职业 \ud83d\udc54",
      fantasy: "奇幻 \ud83e\udd84",
      fashion: "时尚 \ud83d\udc57",
      art: "艺术 \ud83c\udfa8",
    } as Record<string, string>,
    ui: {
      current: "当前生成结果",
      history: "历史生成",
      generating: "\ud83d\udc15 生成中… \u23f3",
      placeholder: "选择风格并上传照片后在此展示",
      selected: "已选",
      selectedRef: "已选参考图：",
      none: "未选择",
      uploadLabel: "上传您的宠物照片",
      max3: "最多3张",
      language: "语言",
      toastSelectTitle: "请选择参考风格",
      toastSelectDesc: "点击左侧卡片选择一个风格",
      toastUploadTitle: "请上传宠物照片",
      toastUploadDesc: "支持最多3张，JPEG/PNG/WebP",
    },
    quality: {
      normal: "普通(100\ud83d\udc8e)",
      q2k: "2K(300\ud83d\udc8e)",
      q4k: "4K(500\ud83d\udc8e)",
    },
    actions: {
      start: "开始AI生成",
      generating: "生成中…",
    },
  },
} as const;

export type Dict = typeof I18N[Lang];

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  L: Dict; // accept any locale dictionary shape
};

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "lang";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = (localStorage.getItem(STORAGE_KEY) as Lang | null) || "en";
      if (saved === "en" || saved === "zh") setLangState(saved);
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  };

  const L = useMemo(() => I18N[lang], [lang]);

  const value = useMemo(() => ({ lang, setLang, L }), [lang, L]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

