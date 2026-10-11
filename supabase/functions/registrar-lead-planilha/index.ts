import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { nome, email, telefone } = await req.json();

    if (!nome || nome.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Nome inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "E-mail inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("leads_planilha").insert({
      nome: nome.trim().slice(0, 120),
      email: email.trim().toLowerCase().slice(0, 200),
      telefone: telefone ? String(telefone).trim().slice(0, 30) : null,
      origem: "planilha-gratis",
    });

    if (error) {
      console.error("insert error", error);
      return new Response(JSON.stringify({ error: "Não foi possível registrar" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        downloadUrl: "/downloads/planilha-controle-financeiro-rm.xlsx",
        whatsappUrl:
          "https://wa.me/5521986000039?text=" +
          encodeURIComponent(
            `Olá Marta Cury! Acabei de baixar a Planilha de Liberdade Financeira pelo site. Meu nome é ${nome}.`
          ),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Erro inesperado" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
