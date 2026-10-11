import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Navigate, Link } from "react-router-dom";
import { Shield, Users, Wallet, CheckSquare, Video } from "lucide-react";

type Stats = { usuarios: number; lancamentos: number; tarefas: number; clientes: number };

export default function Admin() {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<Stats>({ usuarios: 0, lancamentos: 0, tarefas: 0, clientes: 0 });
  const [users, setUsers] = useState<{ user_id: string; full_name: string | null; email: string | null; created_at: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return setChecking(false);
      const { data: role } = await (supabase as any).rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      setIsAdmin(!!role);
      if (role) {
        const [{ data: profs }, l, t, c] = await Promise.all([
          (supabase as any).from("profiles").select("user_id, full_name, email, created_at").order("created_at", { ascending: false }),
          (supabase as any).from("lancamentos").select("*", { count: "exact", head: true }),
          (supabase as any).from("tarefas").select("*", { count: "exact", head: true }),
          (supabase as any).from("clientes").select("*", { count: "exact", head: true }),
        ]);
        setUsers(profs ?? []);
        setStats({ usuarios: profs?.length ?? 0, lancamentos: l.count ?? 0, tarefas: t.count ?? 0, clientes: c.count ?? 0 });
      }
      setChecking(false);
    })();
  }, []);

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
          <Shield className="h-5 w-5 text-primary" />Painel Administrativo
        </h1>
        <p className="text-xs text-muted-foreground">Visão consolidada de toda a plataforma</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Kpi icon={Users} label="Usuários" value={stats.usuarios} />
        <Kpi icon={Users} label="Clientes cadastrados" value={stats.clientes} />
        <Kpi icon={Wallet} label="Lançamentos" value={stats.lancamentos} />
        <Kpi icon={CheckSquare} label="Tarefas" value={stats.tarefas} />
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-2">Usuários da plataforma</h2>
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u.user_id} className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-semibold text-sm">
                {(u.full_name?.[0] ?? u.email?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{u.full_name || "Sem nome"}</div>
                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {new Date(u.created_at).toLocaleDateString("pt-BR")}
              </div>
            </Card>
          ))}
          {users.length === 0 && <Card className="p-6 text-sm text-center text-muted-foreground border-dashed">Nenhum usuário ainda.</Card>}
        </div>
      </div>

      <Link to="/app/admin/reels">
        <Card className="p-4 flex items-center gap-3 hover:bg-secondary/40 transition border-primary/30">
          <div className="h-10 w-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Vídeos em destaque</div>
            <div className="text-xs text-muted-foreground">Adicionar, remover e ordenar os reels do site</div>
          </div>
        </Card>
      </Link>
    </div>

  );
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card className="p-3">
      <div className="text-xs text-muted-foreground flex items-center gap-1"><Icon className="h-3 w-3" />{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </Card>
  );
}
