import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Missing Supabase environment variables", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("revisoes")
    .select("id, data_agendada, tipo, topicos(titulo, materias(user_id, nome))")
    .eq("concluida", false)
    .lte("data_agendada", today);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    date: today,
    pending: data?.length ?? 0,
    reviews: data ?? [],
  });
});
