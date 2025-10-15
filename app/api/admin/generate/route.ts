import { NextResponse } from "next/server";
import { isDev } from "@/utils/admin";

// POST /api/admin/generate
// Generate an image using Doubao SeedDream 4.0 API
export async function POST(req: Request) {
  // Check if admin UI is enabled (dev mode)
  if (!isDev()) {
    return NextResponse.json(
      { error: "Admin API is only available in development mode" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { prompt, image } = body;

    // Validate prompt
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Validate image parameter if provided
    if (image !== undefined) {
      if (!Array.isArray(image) && typeof image !== "string") {
        return NextResponse.json(
          { error: "Image parameter must be a string or array of strings" },
          { status: 400 }
        );
      }

      // Validate array length (max 3 for our UI, but API supports up to 10)
      if (Array.isArray(image) && image.length > 10) {
        return NextResponse.json(
          { error: "Maximum 10 reference images allowed" },
          { status: 400 }
        );
      }
    }

    // Get API key from environment
    const apiKey = process.env.ARK_API_KEY;
    if (!apiKey) {
      console.error("ARK_API_KEY is not configured");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Call Doubao SeedDream 4.0 API
    const apiUrl = "https://ark.cn-beijing.volces.com/api/v3/images/generations";

    const requestBody: any = {
      model: "doubao-seedream-4-0-250828",
      prompt: prompt.trim(),
      size: "1K",
      response_format: "url",
      watermark: false,
      stream: false,
      sequential_image_generation: "disabled",
    };

    // Add reference images if provided
    if (image) {
      requestBody.image = image;
    }

    console.log("[Image Generation] Calling Doubao API with prompt:", prompt.substring(0, 100));
    if (image) {
      const imageCount = Array.isArray(image) ? image.length : 1;
      console.log("[Image Generation] With reference images:", imageCount);
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Image Generation] API error:", response.status, errorText);
      
      return NextResponse.json(
        { 
          error: `API request failed: ${response.status}`,
          details: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Validate response
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      console.error("[Image Generation] Invalid response format:", data);
      return NextResponse.json(
        { error: "Invalid response from image generation API" },
        { status: 500 }
      );
    }

    console.log("[Image Generation] Success:", {
      images: data.data.length,
      size: data.data[0]?.size,
      usage: data.usage,
    });

    // Return the full response
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("[Image Generation] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate image",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

