export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}


export function isDev(): boolean {
  // Primary check
  if (process.env.NODE_ENV === "development") return true;
  // Optional override via env var
  const flag = (process.env.ADMIN_UI_ENABLED || "").trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes" || flag === "on" || flag === "dev";
}

export function adminAccessAllowed(email?: string | null): boolean {
  return isDev() || isAdminEmail(email);
}
