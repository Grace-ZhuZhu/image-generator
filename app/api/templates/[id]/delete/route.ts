import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { isDev } from "@/utils/admin";

export const dynamic = "force-dynamic";

// DELETE /api/templates/[id]/delete
// Deletes a template and its associated images from storage
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Dev-only: disable in production
    if (!isDev()) {
      return NextResponse.json({ error: "Disabled in production" }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // First get the template to access its images
    const { data: template, error: fetchError } = await supabase
      .from("templates")
      .select("id, images, prompt_id")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Delete images from storage
    // The images are stored in the 'templates' bucket with paths like: {uuid}/sm.jpg, {uuid}/md.jpg, etc.
    const imagePaths: string[] = [];
    
    if (template.images && typeof template.images === 'object') {
      const images = template.images as any;
      
      // Collect all image paths
      ['sm', 'md', 'lg', 'orig'].forEach(size => {
        if (images[size]) {
          const sizeImages = images[size];
          if (sizeImages.jpg) imagePaths.push(sizeImages.jpg);
          if (sizeImages.webp) imagePaths.push(sizeImages.webp);
        }
      });
    }

    // Delete files from storage bucket
    if (imagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("templates")
        .remove(imagePaths);

      if (storageError) {
        console.error("Failed to delete some images from storage:", storageError);
        // Continue with DB deletion even if storage deletion fails
      }
    }

    // Delete the template record from database
    const { error: deleteError } = await supabase
      .from("templates")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ 
      success: true, 
      id: template.id,
      prompt_id: template.prompt_id,
      deletedFiles: imagePaths.length
    });
  } catch (e: any) {
    console.error(`/api/templates/[id]/delete error:`, e);
    return NextResponse.json({ error: e?.message ?? "Failed to delete template" }, { status: 500 });
  }
}

