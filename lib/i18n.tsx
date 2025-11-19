"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "zh";

export const I18N = {
  en: {
    hero: {
      title: "Transform Your Pet Into Art",
      desc:
        "Upload your pet's photo, choose a reference style, and get a professional art work.",
    },
    themes: {
      all: "All",
      holiday: "Holiday",
      fantasy: "Fantasy",
      fashion: "Fashion",
      art: "Art",
      studio: "Studio",
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
      useStyleAsTemplate: "Use this style as template",
      back: "Back",
      templateStyle: "Template Style",
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
    notify: {
      bannerText: "We will launch the generate feature soon. Please leave your email, and we’ll notify you as soon as it’s ready.",
      buttonText: "Notify me",
      dialogTitle: "Get notified when Generate launches",
      emailLabel: "Email address",
      submit: "Submit",
      submitting: "Submitting...",
      cancel: "Cancel",
      successNew: "You're on the list! We'll email you when it's ready.",
      successExisting: "You're already on the list. We'll notify you when it's ready.",
      invalidEmail: "Please enter a valid email address",
      failed: "Submission failed. Please try again later",
      networkError: "Network error. Please try again later"
    },
    gallery: {
      title: "Your Gallery",
      signInPrompt: "Sign in to see all pet photos you generate. Once you create images, they will appear here.",
      signIn: "Sign in",
      createAccount: "Create account",
      emptyPrompt: "You haven't created any images yet. Start by uploading your pet photos and generating!",
      createCta: "Create Pet Photo",
      createMore: "Create more →",
    },
    header: {
      navHome: "Home",
      navGallery: "Gallery",
      profile: "Profile",
      dashboard: "Dashboard",
      signIn: "Sign in",
      signUp: "Sign up",
      signOut: "Sign out",
      navigation: "Navigation",
      toggleMenu: "Toggle menu",
    },
    footer: {
      product: { title: "Product", features: "Features", pricing: "Pricing" },
      company: { title: "Company", about: "About", blog: "Blog" },
      legal: { title: "Legal", privacy: "Privacy", terms: "Terms" },
    },
    dashboard: {
      welcomeTitlePrefix: "Welcome back,",
      welcomeDesc: "Create amazing AI-generated pet photos, manage your credits, and track your creations.",
      quickActions: { title: "Quick Actions", createPet: "Create Pet Photo", viewGallery: "View Gallery", buyCredits: "Buy Credits" },
      comingSoon: { title: "Pet Gallery Coming Soon", desc: "Your generated pet photos and creation history will appear here once you start creating!" },
      account: { title: "Account Details", email: "Email", userId: "User ID" },
      pricing: { title: "Pricing", comingSoon: "Coming soon." },
      subscription: { title: "Subscription Status", noPlan: "No Active Plan" },
      credits: { available: "Available Credits", recent: "Recent Activity" },
    },

  },
  zh: {
    hero: {
      title: "Transform Your Pet Into Art",
      desc: "上传宠物照片，选择参考风格与清晰度，10秒生成专业级艺术照片。",
    },
    themes: {
      all: "全部",
      holiday: "节日",
      fantasy: "奇幻",
      fashion: "时尚",
      art: "艺术",
      studio: "工作室",
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
      useStyleAsTemplate: "使用此风格作为模板",
      back: "返回",
      templateStyle: "模板风格",
    },
    quality: {
      normal: "普通(100\ud83d\udc8e)",
      q2k: "2K(300\ud83d\udc8e)",
      q4k: "4K(500\ud83d\udc8e)",
    },
    header: {
      navHome: "首页",
      navGallery: "图库",
      profile: "个人资料",
      dashboard: "控制台",
      signIn: "登录",
      signUp: "注册",
      signOut: "退出登录",
      navigation: "导航",
      toggleMenu: "切换菜单",
    },
    footer: {
      product: { title: "产品", features: "功能", pricing: "定价" },
      company: { title: "公司", about: "关于我们", blog: "博客" },
      legal: { title: "法律", privacy: "隐私政策", terms: "使用条款" },
    },
    dashboard: {
      welcomeTitlePrefix: "欢迎回来，",
      welcomeDesc: "创建惊艳的 AI 宠物写真，管理你的点数并追踪你的创作记录。",
      quickActions: { title: "快速操作", createPet: "创建宠物照片", viewGallery: "查看图库", buyCredits: "购买点数" },
      comingSoon: { title: "宠物图库即将上线", desc: "当你开始创作后，你生成的宠物照片与历史记录将展示在这里。" },
      account: { title: "账户信息", email: "邮箱", userId: "用户 ID" },
      pricing: { title: "定价", comingSoon: "敬请期待。" },
      subscription: { title: "订阅状态", noPlan: "暂无订阅" },
      credits: { available: "可用点数", recent: "近期活动" },
    },

    actions: {
      start: "开始AI生成",
      generating: "生成中…",
    },
    notify: {
      bannerText: "我们很快会上线 generate 功能，请留下您的邮箱，我们会第一时间通知您",
      buttonText: "登记邮箱",
      dialogTitle: "订阅功能上线通知",
      emailLabel: "邮箱地址",
      submit: "提交",
      submitting: "提交中...",
      cancel: "取消",
      successNew: "登记成功！我们会在功能上线时第一时间通知您。",
      successExisting: "您已登记过，我们会在功能上线时通知您。",
      invalidEmail: "请输入有效的邮箱地址",
      failed: "提交失败，请稍后重试",
      networkError: "网络异常，请稍后重试"
    },
    gallery: {
      title: "你的图库",
      signInPrompt: "登录后可查看你生成的宠物照片。创建完成后将展示在这里。",
      signIn: "登录",
      createAccount: "创建账号",
      emptyPrompt: "你还没有创建任何图片。先上传宠物照片并开始生成吧！",
      createCta: "去创建宠物照片",
      createMore: "继续创作 		\u2192",
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

