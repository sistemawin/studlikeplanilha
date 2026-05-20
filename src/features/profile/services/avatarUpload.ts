import type { SupabaseClient } from "@supabase/supabase-js";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_SIZE_BYTES = 3 * 1024 * 1024;

function extensionFromFile(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  const fromType = file.type.split("/")[1]?.toLowerCase();
  return fromType || "jpg";
}

export function validateAvatarFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Envie um arquivo de imagem.");
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new Error("A imagem precisa ter até 3 MB.");
  }
}

export async function uploadUserAvatar(supabase: SupabaseClient, userId: string, file: File) {
  validateAvatarFile(file);

  const extension = extensionFromFile(file);
  const path = `${userId}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
