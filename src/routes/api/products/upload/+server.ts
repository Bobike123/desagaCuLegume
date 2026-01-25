// FILE: src/routes/api/products/upload/+server.ts

import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { handleApiError } from "$lib/helpers";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(event: RequestEvent) {
  try {
    if (!event.locals.isAdmin)
      return json({ error: "Unauthorized" }, { status: 401 });

    const formData = await event.request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE)
      return json({ error: "File too large (max 5MB)" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return json(
        { error: "Invalid file type. Only JPEG, PNG, WebP allowed" },
        { status: 400 }
      );
    }

    const supabase = event.locals.supabase;

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    return json({ url: urlData.publicUrl }, { status: 200 });
  } catch (error) {
    const err = handleApiError(error, "Upload failed");
    return json({ error: err.error }, { status: err.status });
  }
}
