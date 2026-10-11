import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Shield, Trash2, ArrowUp, ArrowDown, Plus, Video } from "lucide-react";

type Reel = {
  id: string;
  code: string;
  titulo: string;
  ordem: number;
  ativo: boolean;
};

/** Aceita o código puro ou uma URL completa do reel. */
function extrairCodigo(entrada: string): string {
  const v = entrada.trim();
  const m = v.match(/instagram\.com\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/);
  return (m ? m[1] : v).replace(/\/+$/, "");
}

export default function AdminReels() {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reels, setReels] = useState<Reel[]>([]);
  const [code, setCode] = useState("");
  const [titulo, setTitulo] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    const { data } = await (supabase as any)
      .from("reels_destaque")
      .select("id, code, titulo, ordem, ativo")
      .order("ordem", { ascending: true });
    setReels(data ?? []);
  };

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return setChecking(false);
      const { data: role } = await (supabase as any).rpc("has_role", {
        _user_id: u.user.id,
        _role: "admin",
      });
      setIsAdmin(!!role);
      if (role) await carregar();
      setChecking(false);
    })();
  }, []);

  const adicionar = async () => {
    const codigo = extrairCodigo(code);
    if (!codigo || !titulo.trim()) {
      toast.error("Informe o link (ou código) do reel e um título.");
      return;
    }
    setSalvando(true);
    const proximaOrdem = (reels.at(-1)?.ordem ?? 0) + 1;
    const { error } = await (supabase as any).from("reels_destaque").insert({
      code: codigo,
      titulo: titulo.trim(),
      ordem: proximaOrdem,
    });
    setSalvando(false);
    if (error) return toast.error("Não foi possível adicionar o vídeo.");
    setCode("");
    setTitulo("");
    toast.success("Vídeo adicionado à seção.");
    carregar();
  };

  const remover = async (id: string) => {
    const { error } = await (supabase as any).from("reels_destaque").delete().eq("id", id);
    if (error) return toast.error("Não foi possível remover o vídeo.");
    setReels((r) => r.filter((x) => x.id !== id));
    toast.success("Vídeo removido.");
  };

  const alternarAtivo = async (reel: Reel) => {
    const { error } = await (supabase as any)
      .from("reels_destaque")
      .update({ ativo: !reel.ativo })
      .eq("id", reel.id);
    if (error) return toast.error("Não foi possível atualizar o vídeo.");
    setReels((r) => r.map((x) => (x.id === reel.id ? { ...x, ativo: !x.ativo } : x)));
  };

  const mover = async (index: number, direcao: -1 | 1) => {
    const destino = index + direcao;
    if (destino < 0 || destino >= reels.length) return;
    const novos = [...reels];
    [novos[index], novos[destino]] = [novos[destino], novos[index]];
    const comOrdem = novos.map((r, i) => ({ ...r, ordem: i + 1 }));
    setReels(comOrdem);
    const alvos = [comOrdem[index], comOrdem[destino]];
    for (const r of alvos) {
      await (supabase as any).from("reels_destaque").update({ ordem: r.ordem }).eq("id", r.id);
    }
  };

  if (checking) return <div className="text-sm text-muted-foreground">Verificando permissões…</div>;
  if (!isAdmin)
    return (
      <Card className="p-8 text-center border-dashed">
        <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <div className="font-medium">Acesso restrito</div>
        <p className="text-sm text-muted-foreground">Esta área é exclusiva para administradores.</p>
      </Card>
    );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-serif font-semibold flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          Vídeos em destaque
        </h1>
        <p className="text-xs text-muted-foreground">
          Gerencie os reels exibidos na página inicial do site.
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <h2 className="text-sm font-semibold">Adicionar vídeo</h2>
        <div className="space-y-2">
          <Label htmlFor="reel-code">Link ou código do reel</Label>
          <Input
            id="reel-code"
            placeholder="https://www.instagram.com/reel/Db8XL80uDKc/"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reel-titulo">Título exibido no site</Label>
          <Input
            id="reel-titulo"
            placeholder="Como organizar as contas do mês"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </div>
        <Button onClick={adicionar} disabled={salvando} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          {salvando ? "Adicionando…" : "Adicionar vídeo"}
        </Button>
      </Card>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">
          {reels.length === 1 ? "1 vídeo cadastrado" : `${reels.length} vídeos cadastrados`}
        </h2>
        {reels.map((reel, i) => (
          <Card key={reel.id} className="p-3 flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => mover(i, -1)}
                disabled={i === 0}
                aria-label="Mover para cima"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => mover(i, 1)}
                disabled={i === reels.length - 1}
                aria-label="Mover para baixo"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{reel.titulo}</div>
              <a
                href={`https://www.instagram.com/reel/${reel.code}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary truncate block"
              >
                {reel.code}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={reel.ativo}
                onCheckedChange={() => alternarAtivo(reel)}
                aria-label="Exibir no site"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => remover(reel.id)}
                aria-label="Remover vídeo"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
        {reels.length === 0 && (
          <Card className="p-6 text-sm text-center text-muted-foreground border-dashed">
            Nenhum vídeo cadastrado ainda.
          </Card>
        )}
      </div>
    </div>
  );
}
