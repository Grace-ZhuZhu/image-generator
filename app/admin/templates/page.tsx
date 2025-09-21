import { notFound } from "next/navigation";
import TemplatesUploader from "@/components/admin/TemplatesUploader";
import { isDev } from "@/utils/admin";

export default async function AdminTemplatesPage() {
  // Admin UI is DEV-only; in non-dev environments the page is hidden
  if (!isDev()) {
    notFound();
  }
  return <TemplatesUploader />;
}

