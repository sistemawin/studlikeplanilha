import type { SupabaseClient } from "@supabase/supabase-js";
import { TERMS_VERSION } from "@/features/lgpd/constants";

type ConsentRow = {
  aceitou_termos: boolean | null;
  termos_versao: string | null;
};

export async function loadTermsConsent(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("aceitou_termos,termos_versao")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  const row = data as ConsentRow | null;
  return Boolean(row?.aceitou_termos && row.termos_versao === TERMS_VERSION);
}

export async function acceptTermsConsent(supabase: SupabaseClient, userId: string, name?: string) {
  const acceptedAt = new Date().toISOString();
  const payload = {
    aceitou_termos: true,
    termos_aceitos_em: acceptedAt,
    termos_versao: TERMS_VERSION,
    updated_at: acceptedAt,
  };

  const { data, error: updateError } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (updateError) throw updateError;
  if (data) return;

  const { error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      name: name?.trim() || null,
      ...payload,
    });

  if (insertError) throw insertError;
}
