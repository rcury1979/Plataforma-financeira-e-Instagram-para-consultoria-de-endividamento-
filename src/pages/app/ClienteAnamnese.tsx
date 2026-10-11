import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, FileDown, Save, BadgeCheck } from "lucide-react";

const PERGUNTAS: { key: string; label: string; tipo: "texto" | "longo" | "numero" }[] = [
  { key: "renda_mensal", label: "Renda mensal líquida (R$)", tipo: "numero" },
  { key: "renda_extra", label: "Tem alguma renda extra? Qual?", tipo: "texto" },
  { key: "gasto_fixo", label: "Total de gastos fixos por mês (R$)", tipo: "numero" },
  { key: "total_dividas", label: "Total de dívidas hoje (R$)", tipo: "numero" },
  { key: "dividas_detalhe", label: "Quais dívidas e com quem?", tipo: "longo" },
  { key: "nome_negativado", label: "O nome está negativado? (sim/não)", tipo: "texto" },
  { key: "reserva", label: "Tem reserva de emergência? Quanto?", tipo: "texto" },
  { key: "maior_dor", label: "Qual a maior dor financeira hoje?", tipo: "longo" },
  { key: "objetivo_12m", label: "O que quer conquistar nos próximos 12 meses?", tipo: "longo" },
  { key: "compromisso", label: "Quanto consegue destinar por mês para sair das dívidas? (R$)", tipo: "numero" },
];

type Analise = { id: string; titulo: string; conteudo: string; revisado: boolean; created_at: string };

export default function ClienteAnamnese({ clienteId, clienteNome }: { clienteId: string; clienteNome: string }) {
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [gerando, setGerando] = useState(false);

  const load = async () => {
    const [an, al] = await Promise.all([
      (supabase as any).from("cliente_anamnese").select("respostas").eq("cliente_id", clienteId).maybeSingle(),
      (supabase as any).from("cliente_analises").select("id,titulo,conteudo,revisado,created_at").eq("cliente_id", clienteId).order("created_at", { ascending: false }),
    ]);
    setRespostas((an.data?.respostas ?? {}) as Record<string, string>);
    setAnalises((al.data ?? []) as Analise[]);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [clienteId]);

  const salvar = async () => {
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }
    const { error } = await (supabase as any)
      .from("cliente_anamnese")
      .upsert({ user_id: user.id, cliente_id: clienteId, respostas }, { onConflict: "cliente_id" });
    setSalvando(false);
    if (error) return toast.error(error.message);
    await (supabase as any).from("cliente_eventos").insert({
      user_id: user.id,
      cliente_id: clienteId,
      tipo: "anamnese",
      titulo: "Anamnese atualizada",
      descricao: "As informações do diagnóstico financeiro foram revisadas.",
    });
    toast.success("Anamnese salva");
  };

  const gerarAnalise = async () => {
    setGerando(true);
    const { data, error } = await supabase.functions.invoke("analise-cliente-ia", { body: { clienteId } });
    setGerando(false);
    if (error) {
      const detalhe = "context" in error ? await (error as any).context.text().catch(() => "") : error.message;
      console.error("analise-cliente-ia falhou:", detalhe);
      return toast.error("Não conseguimos gerar a análise agora.");
    }
    if ((data as any)?.error) return toast.error((data as any).error);
    toast.success("Análise gerada — revise antes de enviar ao cliente");
    load();
  };

  const marcarRevisado = async (a: Analise) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await (supabase as any)
      .from("cliente_analises")
      .update({ revisado: true, revisado_em: new Date().toISOString(), revisado_por: user.id })
      .eq("id", a.id);
    if (error) return toast.error(error.message);
    await (supabase as any).from("cliente_eventos").insert({
      user_id: user.id,
      cliente_id: clienteId,
      tipo: "analise",
      titulo: "Análise revisada pela educadora",
      descricao: a.titulo,
      entidade_id: a.id,
    });
    load();
  };

  const exportarPdf = async (a: Analise) => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margem = 48;
    const largura = doc.internal.pageSize.getWidth() - margem * 2;
    let y = margem;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(clienteNome, margem, y);
    y += 20;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(a.titulo, margem, y);
    y += 24;

    for (const linha of a.conteudo.split("\n")) {
      const titulo = linha.startsWith("#");
      const texto = linha.replace(/^#+\s*/, "").replace(/\*\*/g, "");
      if (!texto.trim()) { y += 8; continue; }
      doc.setFont("helvetica", titulo ? "bold" : "normal");
      doc.setFontSize(titulo ? 13 : 11);
      for (const parte of doc.splitTextToSize(texto, largura)) {
        if (y > doc.internal.pageSize.getHeight() - margem) { doc.addPage(); y = margem; }
        doc.text(parte, margem, y);
        y += titulo ? 18 : 15;
      }
      if (titulo) y += 4;
    }

    doc.save(`analise-${clienteNome.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  };

  return (
    <div className="space-y-4 pt-3">
      <Card className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          A anamnese é a base do diagnóstico. Preencha junto com o cliente, no ritmo dele.
        </p>
        {PERGUNTAS.map((p) => (
          <div key={p.key}>
            <Label className="text-xs">{p.label}</Label>
            {p.tipo === "longo" ? (
              <Textarea rows={2} value={respostas[p.key] ?? ""} onChange={(e) => setRespostas({ ...respostas, [p.key]: e.target.value })} />
            ) : (
              <Input
                type={p.tipo === "numero" ? "number" : "text"}
                step={p.tipo === "numero" ? "0.01" : undefined}
                value={respostas[p.key] ?? ""}
                onChange={(e) => setRespostas({ ...respostas, [p.key]: e.target.value })}
              />
            )}
          </div>
        ))}
        <div className="flex gap-2">
          <Button size="sm" onClick={salvar} disabled={salvando}>
            <Save className="h-3.5 w-3.5 mr-1" /> {salvando ? "Salvando…" : "Salvar anamnese"}
          </Button>
          <Button size="sm" variant="outline" onClick={gerarAnalise} disabled={gerando}>
            <Sparkles className="h-3.5 w-3.5 mr-1" /> {gerando ? "Gerando…" : "Gerar análise com IA"}
          </Button>
        </div>
      </Card>

      {analises.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Análises ({analises.length})</h3>
          {analises.map((a) => (
            <Card key={a.id} className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{a.titulo}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {a.revisado ? "Revisado por você" : "Rascunho de IA — revise antes de entregar"}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!a.revisado && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => marcarRevisado(a)}>
                      <BadgeCheck className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => exportarPdf(a)}>
                    <FileDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="text-xs whitespace-pre-wrap max-h-64 overflow-y-auto text-foreground/85">{a.conteudo}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
