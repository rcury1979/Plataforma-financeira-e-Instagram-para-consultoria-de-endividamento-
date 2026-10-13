/**
 * Cliente Supabase SIMULADO — usado apenas no site de teste (VITE_TEST_SITE=1).
 * Não fala com nenhum servidor: guarda tudo no navegador (localStorage).
 * Logins de teste:
 *   teste@rmconsultoria.com / Teste@2026  → Pessoa Jurídica, administrador
 *   pf@rmconsultoria.com    / Teste@2026  → Pessoa Física
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CATEGORIAS_PADRAO } from "@/pages/cliente/_icons";

export const DEMO_PASSWORD = "Teste@2026";
const USERS: Record<string, { id: string; nome: string; tipo: "PF" | "PJ"; admin: boolean }> = {
  "teste@rmconsultoria.com": { id: "demo-pj-0001", nome: "Usuário Teste PJ", tipo: "PJ", admin: true },
  "pf@rmconsultoria.com": { id: "demo-pf-0001", nome: "Usuário Teste PF", tipo: "PF", admin: false },
};

const DB_KEY = "rm-demo-db-v3";
const SESSION_KEY = "rm-demo-session-v1";
const mem: Record<string, string> = {};
const store = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return mem[k] ?? null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { mem[k] = v; } },
  del(k: string) { try { localStorage.removeItem(k); } catch { delete mem[k]; } },
};

const uid = () => (crypto as any).randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const now = () => new Date().toISOString();
const day = (offset: number) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };

type Row = Record<string, any>;
type DB = Record<string, Row[]>;

function seed(): DB {
  const pj = USERS["teste@rmconsultoria.com"].id;
  const pf = USERS["pf@rmconsultoria.com"].id;
  const base = () => ({ created_at: now(), updated_at: now() });
  const c1 = uid(), c2 = uid(), c3 = uid();
  const trial = new Date(Date.now() + 6 * 864e5).toISOString();
  return {
    profiles: [
      { id: uid(), user_id: pj, full_name: USERS["teste@rmconsultoria.com"].nome, email: "teste@rmconsultoria.com", tipo_pessoa: "PJ", plano: "trial", trial_ends_at: trial, cpf: null, phone: null, data_nascimento: null, objetivo_financeiro: null, ...base() },
      { id: uid(), user_id: pf, full_name: USERS["pf@rmconsultoria.com"].nome, email: "pf@rmconsultoria.com", tipo_pessoa: "PF", plano: "trial", trial_ends_at: trial, cpf: null, phone: null, data_nascimento: null, objetivo_financeiro: "Sair das dívidas", ...base() },
    ],
    usuario_empresas: [{ id: uid(), user_id: pj, empresa_id: "demo-empresa-0001", ...base() }],
    clientes: [
      { id: c1, user_id: pj, nome: "Padaria Bom Pão (exemplo)", tipo_pessoa: "PJ", documento: "00.000.000/0001-00", email: "contato@exemplo.com", telefone: "(21) 90000-0001", observacoes: null, responsavel_id: null, cliente_user_id: null, arquivado: false, ...base() },
      { id: c2, user_id: pj, nome: "Maria Souza (exemplo)", tipo_pessoa: "PF", documento: null, email: "maria@exemplo.com", telefone: "(21) 90000-0002", observacoes: "Renegociação de cartão", responsavel_id: null, cliente_user_id: null, arquivado: false, ...base() },
      { id: uid(), user_id: pj, nome: "Usuário Teste PF", tipo_pessoa: "PF", documento: null, email: "pf@rmconsultoria.com", telefone: "(21) 90000-0004", observacoes: "Cliente vinculado ao app (login de teste PF)", responsavel_id: pj, cliente_user_id: pf, arquivado: false, ...base() },
      { id: uid(), user_id: pj, nome: "Ana Paula (convite enviado)", tipo_pessoa: "PF", documento: null, email: "ana@exemplo.com", telefone: "(21) 90000-0005", observacoes: null, responsavel_id: pj, cliente_user_id: null, arquivado: false, ...base() },
      { id: c3, user_id: pj, nome: "Igreja Esperança (exemplo)", tipo_pessoa: "PJ", documento: null, email: null, telefone: null, observacoes: null, responsavel_id: null, cliente_user_id: null, arquivado: false, ...base() },
    ],
    lancamentos: [
      { id: uid(), user_id: pj, cliente_id: c1, tipo: "receita", descricao: "Mentoria mensal", valor: 1200, data: day(-10), categoria: "Serviços", forma_pagamento: "pix", observacoes: null, parcela_atual: null, parcelas_total: null, planejado: false, recorrente: true, ...base() },
      { id: uid(), user_id: pj, cliente_id: c2, tipo: "receita", descricao: "Diagnóstico financeiro", valor: 450, data: day(-4), categoria: "Serviços", forma_pagamento: "cartao", observacoes: null, parcela_atual: null, parcelas_total: null, planejado: false, recorrente: false, ...base() },
      { id: uid(), user_id: pj, cliente_id: null, tipo: "despesa", descricao: "Aluguel sala", valor: 900, data: day(-8), categoria: "Estrutura", forma_pagamento: "boleto", observacoes: null, parcela_atual: null, parcelas_total: null, planejado: false, recorrente: true, ...base() },
      { id: uid(), user_id: pj, cliente_id: null, tipo: "despesa", descricao: "Anúncios Instagram", valor: 300, data: day(-2), categoria: "Marketing", forma_pagamento: "cartao", observacoes: null, parcela_atual: null, parcelas_total: null, planejado: false, recorrente: false, ...base() },
    ],
    tarefas: [
      { id: uid(), user_id: pj, cliente_id: c1, titulo: "Enviar plano de 90 dias", descricao: null, prazo: day(2), prioridade: "alta", status: "pendente", concluida_em: null, ...base() },
      { id: uid(), user_id: pj, cliente_id: c2, titulo: "Revisar extrato do cartão", descricao: null, prazo: day(5), prioridade: "media", status: "pendente", concluida_em: null, ...base() },
    ],
    leads: [
      { id: uid(), user_id: pj, nome: "João Lima (exemplo)", email: "joao@exemplo.com", telefone: "(21) 90000-0003", origem: "Instagram", etapa: "novo", status: "aberto", tipo_pessoa: "PF", valor_estimado: 600, proximo_contato: day(1), observacoes: null, cliente_id: null, arquivado: false, ...base() },
    ],
    pf_transacoes: [
      { id: uid(), user_id: pf, tipo: "receita", categoria: "Salário", descricao: "Salário", valor: 4200, data: day(-6), recorrente: true, parcela_atual: null, parcelas_total: null, ...base() },
      { id: uid(), user_id: pf, tipo: "despesa", categoria: "Moradia", descricao: "Aluguel", valor: 1500, data: day(-5), recorrente: true, parcela_atual: null, parcelas_total: null, ...base() },
      { id: uid(), user_id: pf, tipo: "despesa", categoria: "Mercado", descricao: "Supermercado", valor: 820, data: day(-3), recorrente: false, parcela_atual: null, parcelas_total: null, ...base() },
    ],
    pf_dividas: [
      { id: uid(), user_id: pf, credor: "Cartão de crédito (exemplo)", descricao: null, valor_total: 5400, valor_pago: 1200, parcelas_total: 12, parcelas_pagas: 3, taxa_juros_mensal: 9.5, vencimento: day(12), quitada: false, ...base() },
    ],
    pf_metas_pessoais: [
      { id: uid(), user_id: pf, titulo: "Reserva de emergência", categoria: "Reserva", valor_alvo: 10000, valor_atual: 2500, prazo: day(240), concluida: false, ...base() },
    ],
    ...seedCliente(pf),
    pf_patrimonio: [
      { id: uid(), user_id: pf, descricao: "Conta corrente", tipo: "conta", instituicao: "Banco Exemplo", valor_atual: 1800, liquido: true, observacoes: null, ...base() },
    ],
  };
}


// ---------- Área do Cliente (PF): dados de exemplo ----------
function seedCliente(pf: string) {
  const base = () => ({ user_id: pf, created_at: now(), updated_at: now() });
  const d = new Date();
  const am = (delta: number) => { const x = new Date(d.getFullYear(), d.getMonth() + delta, 1); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`; };
  const dia = (delta: number, dd: number) => `${am(delta)}-${String(dd).padStart(2, "0")}`;
  const itau = uid(), nubank = uid(), cartao = uid();
  const cats = CATEGORIAS_PADRAO.map((c, i) => ({ id: uid(), ...c, parent_id: null, ordem: i, ...base() }));
  const cat = (n: string) => cats.find((c) => c.nome === n)!.id;
  const L = (tipo: string, descricao: string, valor: number, data: string, categoria: string | null, conta: string | null, extra: Record<string, any> = {}) =>
    ({ id: uid(), tipo, descricao, valor, data, categoria_id: categoria ? cat(categoria) : null, conta_id: conta, cartao_id: null, conta_destino_id: null, pago: true, recorrente: false, observacao: null, origem: "manual", ...base(), ...extra });
  const lancs: Row[] = [];
  for (const m of [-2, -1, 0]) {
    lancs.push(L("receita", "Salário", 3800, dia(m, 5), "Salário", itau, { recorrente: true }));
    lancs.push(L("receita", "Freela de design", m === -1 ? 600 : 300, dia(m, 12), "Renda extra", nubank));
    lancs.push(L("despesa", "Aluguel", 1400, dia(m, 6), "Moradia", itau, { recorrente: true }));
    lancs.push(L("despesa", "Supermercado", 640 + m * -35, dia(m, 9), "Mercado", null, { cartao_id: cartao }));
    lancs.push(L("despesa", "Dízimo", 380, dia(m, 6), "Dízimo e doações", nubank, { recorrente: true }));
    lancs.push(L("despesa", "Plano de celular", 87, dia(m, 10), "Assinaturas", itau, { recorrente: true, pago: m < 0 }));
    lancs.push(L("despesa", "Seguro do carro", 135, dia(m, 20), "Seguros", itau, { recorrente: true, pago: m < 0 }));
    lancs.push(L("despesa", "Restaurante", 120 + m * -20, dia(m, 15), "Alimentação", null, { cartao_id: cartao }));
    lancs.push(L("despesa", "Combustível", 260, dia(m, 3), "Transporte", nubank));
  }
  lancs.push(L("transferencia", "Transferência", 300, dia(0, 7), null, itau, { conta_destino_id: nubank }));
  lancs.push(L("receita", "Reembolso consulta", 150, dia(0, 25), "Outras receitas", nubank, { pago: false }));
  const divida = uid(), apto = uid(), reserva = uid(), tarefa1 = uid();
  return {
    cli_contas: [
      { id: itau, nome: "Itaú", tipo: "corrente", saldo_inicial: 1290, arquivada: false, ...base() },
      { id: nubank, nome: "Nubank", tipo: "corrente", saldo_inicial: 248, arquivada: false, ...base() },
    ],
    cli_cartoes: [{ id: cartao, nome: "Cartão Black", limite: 9000, dia_fechamento: 1, dia_vencimento: 10, conta_pagamento_id: itau, arquivado: false, ...base() }],
    cli_categorias: cats,
    cli_lancamentos: lancs,
    cli_limites: [
      { id: uid(), categoria_id: cat("Mercado"), valor: 700, ...base() },
      { id: uid(), categoria_id: cat("Alimentação"), valor: 150, ...base() },
      { id: uid(), categoria_id: cat("Transporte"), valor: 300, ...base() },
    ],
    cli_tarefas: [
      { id: uid(), titulo: "Preparar material da próxima mentoria", descricao: "Planilha de orçamento + roteiro GCPM.", prazo: dia(0, 12), status: "pendente", concluida_em: null, criado_por: null, ...base(), user_id: USERS["teste@rmconsultoria.com"].id },
      { id: uid(), titulo: "Enviar convite para Ana Paula", descricao: null, prazo: dia(0, 2), status: "pendente", concluida_em: null, criado_por: null, ...base(), user_id: USERS["teste@rmconsultoria.com"].id },
      { id: tarefa1, titulo: "Montar reserva de emergência no Nubank", descricao: "Começar com R$ 50 por semana.", prazo: dia(0, 28), status: "pendente", concluida_em: null, criado_por: null, ...base() },
      { id: uid(), titulo: "Listar todas as assinaturas", descricao: null, prazo: dia(-1, 20), status: "concluida", concluida_em: `${dia(-1, 18)}T12:00:00Z`, criado_por: null, ...base() },
    ],
    cli_tarefa_comentarios: [{ id: uid(), tarefa_id: tarefa1, autor_nome: "Martiniana Cury", texto: "Pode deixar a reserva separada da conta do dia a dia.", ...base() }],
    cli_objetivos: [
      { id: uid(), titulo: "Reserva de emergência", prioridade: "essencial", valor: 15000, idade_alvo: 40, ativo_venda_id: null, concluido: false, ...base() },
      { id: uid(), titulo: "Viagem em família", prioridade: "sonho", valor: 12000, idade_alvo: 42, ativo_venda_id: null, concluido: false, ...base() },
      { id: uid(), titulo: "Trocar de carro", prioridade: "desejo", valor: 40000, idade_alvo: 45, ativo_venda_id: null, concluido: false, ...base() },
    ],
    cli_planejamento: [{ id: uid(), idade_atual: 38, aposentar_aos: 65, renda_mes: 5000, aporte_mes: 500, taxa_aa: 8, inflacao: 4, viver_ate: 90, usar_patrimonio: true, ...base() }],
    cli_dividas: [{ id: divida, nome: "Cartão Black (parcelado)", tipo: "cartao", juros_mes: null, dia_vencimento: 6, quitada: false, observacao: null, ...base() }],
    cli_patrimonio: [
      { id: apto, nome: "Apartamento", tipo: "imovel", observacao: "Apartamento quitado", liquido: false, vendido: false, ...base() },
      { id: reserva, nome: "Reserva no Nubank", tipo: "investimento", observacao: null, liquido: true, vendido: false, ...base() },
    ],
    cli_snapshots: [
      { id: uid(), item_tipo: "divida", item_id: divida, ano_mes: am(-3), valor: 9100, parcela: 480, em_atraso: false, ...base() },
      { id: uid(), item_tipo: "divida", item_id: divida, ano_mes: am(-2), valor: 8800, parcela: 480, em_atraso: false, ...base() },
      { id: uid(), item_tipo: "divida", item_id: divida, ano_mes: am(-1), valor: 8325, parcela: 480, em_atraso: false, ...base() },
      { id: uid(), item_tipo: "patrimonio", item_id: apto, ano_mes: am(-3), valor: 800000, parcela: null, em_atraso: false, ...base() },
      { id: uid(), item_tipo: "patrimonio", item_id: reserva, ano_mes: am(-3), valor: 1200, parcela: null, em_atraso: false, ...base() },
      { id: uid(), item_tipo: "patrimonio", item_id: reserva, ano_mes: am(-1), valor: 1800, parcela: null, em_atraso: false, ...base() },
    ],
    cli_despesas_nr: [
      { id: uid(), descricao: "IPVA", valor: 1800, mes: 1, categoria_id: cat("Transporte"), ...base() },
      { id: uid(), descricao: "Material escolar", valor: 900, mes: 2, categoria_id: cat("Educação"), ...base() },
      { id: uid(), descricao: "Presentes de Natal", valor: 1200, mes: 12, categoria_id: cat("Outros"), ...base() },
    ],
    cli_entradas_sazonais: [{ id: uid(), descricao: "13º salário", valor: 3800, mes: 12, ...base() }],
    cli_reunioes: [{ id: uid(), data: dia(-1, 14), titulo: "Reunião 1: diagnóstico", resumo: "Mapeamos receitas e despesas. Próximo passo: cortar assinaturas e começar a reserva.", material_url: null, created_by: null, ...base() }],
  };
}

function loadDB(): DB {
  const raw = store.get(DB_KEY);
  if (raw) { try { return JSON.parse(raw); } catch { /* recria */ } }
  const db = seed(); store.set(DB_KEY, JSON.stringify(db)); return db;
}
function saveDB(db: DB) { store.set(DB_KEY, JSON.stringify(db)); }

// ---------- auth ----------
function makeSession(email: string) {
  const u = USERS[email];
  const user = { id: u.id, email, aud: "authenticated", role: "authenticated", created_at: now(), app_metadata: {}, user_metadata: { full_name: u.nome } };
  return { access_token: "demo", refresh_token: "demo", token_type: "bearer", expires_in: 3600 * 24, expires_at: Math.floor(Date.now() / 1000) + 86400, user };
}
function currentSession(): any { const r = store.get(SESSION_KEY); try { return r ? JSON.parse(r) : null; } catch { return null; } }
const listeners = new Set<(e: string, s: any) => void>();
const emit = (e: string, s: any) => listeners.forEach((fn) => { try { fn(e, s); } catch { /* ignore */ } });
const err = (message: string) => ({ message, name: "DemoError", status: 400 });

const auth = {
  async getSession() { return { data: { session: currentSession() }, error: null }; },
  async getUser() { const s = currentSession(); return { data: { user: s?.user ?? null }, error: s ? null : err("Sem sessão") }; },
  onAuthStateChange(fn: (e: string, s: any) => void) {
    listeners.add(fn);
    setTimeout(() => fn("INITIAL_SESSION", currentSession()), 0);
    return { data: { subscription: { unsubscribe: () => listeners.delete(fn) } } };
  },
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const e = (email || "").trim().toLowerCase();
    if (!USERS[e] || password !== DEMO_PASSWORD) return { data: { user: null, session: null }, error: err("Login de teste inválido. Use teste@rmconsultoria.com ou pf@rmconsultoria.com com a senha Teste@2026.") };
    const s = makeSession(e); store.set(SESSION_KEY, JSON.stringify(s)); emit("SIGNED_IN", s);
    return { data: { user: s.user, session: s }, error: null };
  },
  async signUp() { return { data: { user: null, session: null }, error: err("Cadastro desativado no site de teste. Entre com teste@rmconsultoria.com / Teste@2026.") }; },
  async signOut() { store.del(SESSION_KEY); emit("SIGNED_OUT", null); return { error: null }; },
  async updateUser() { const s = currentSession(); return { data: { user: s?.user ?? null }, error: null }; },
  async setSession() { return { data: { session: currentSession(), user: currentSession()?.user ?? null }, error: null }; },
  async resetPasswordForEmail() { return { data: {}, error: null }; },
  async signInWithOAuth() { return { data: {}, error: err("Login social indisponível no site de teste.") }; },
};

// ---------- consultas ----------
const singular = (t: string) => t.replace(/s$/, "");
function cmp(a: any, b: any) { if (a == null) return b == null ? 0 : -1; if (b == null) return 1; return a < b ? -1 : a > b ? 1 : 0; }

class Query implements PromiseLike<any> {
  private op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: any = null;
  private filters: ((r: Row) => boolean)[] = [];
  private orders: { col: string; asc: boolean }[] = [];
  private lim: number | null = null;
  private from_: number | null = null; private to_: number | null = null;
  private mode: "many" | "single" | "maybe" = "many";
  private returning = false;
  private countOpt: string | null = null; private head = false;
  constructor(private table: string) {}

  select(_cols = "*", opts?: { count?: string; head?: boolean }) {
    if (this.op === "select") { this.countOpt = opts?.count ?? null; this.head = !!opts?.head; } else this.returning = true;
    return this;
  }
  insert(v: any) { this.op = "insert"; this.payload = v; return this; }
  upsert(v: any) { this.op = "upsert"; this.payload = v; return this; }
  update(v: any) { this.op = "update"; this.payload = v; return this; }
  delete() { this.op = "delete"; return this; }
  eq(c: string, v: any) { this.filters.push((r) => r[c] === v || (r[c] != null && v != null && String(r[c]) === String(v))); return this; }
  neq(c: string, v: any) { this.filters.push((r) => r[c] !== v); return this; }
  gt(c: string, v: any) { this.filters.push((r) => r[c] != null && r[c] > v); return this; }
  gte(c: string, v: any) { this.filters.push((r) => r[c] != null && r[c] >= v); return this; }
  lt(c: string, v: any) { this.filters.push((r) => r[c] != null && r[c] < v); return this; }
  lte(c: string, v: any) { this.filters.push((r) => r[c] != null && r[c] <= v); return this; }
  in(c: string, vs: any[]) { this.filters.push((r) => vs.includes(r[c])); return this; }
  is(c: string, v: any) { this.filters.push((r) => (v === null ? r[c] == null : r[c] === v)); return this; }
  like(c: string, p: string) { return this.ilike(c, p); }
  ilike(c: string, p: string) { const re = new RegExp("^" + p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".") + "$", "i"); this.filters.push((r) => re.test(String(r[c] ?? ""))); return this; }
  match(o: Row) { Object.entries(o).forEach(([k, v]) => this.eq(k, v)); return this; }
  filter(c: string, op: string, v: any) { const f: any = (this as any)[op]; return typeof f === "function" ? f.call(this, c, v) : this; }
  not() { return this; }
  or() { return this; }
  contains() { return this; }
  order(col: string, o?: { ascending?: boolean }) { this.orders.push({ col, asc: o?.ascending !== false }); return this; }
  limit(n: number) { this.lim = n; return this; }
  range(a: number, b: number) { this.from_ = a; this.to_ = b; return this; }
  single() { this.mode = "single"; return this; }
  maybeSingle() { this.mode = "maybe"; return this; }
  returns() { return this; }
  throwOnError() { return this; }

  private run() {
    const db = loadDB();
    const rows = (db[this.table] ||= []);
    const user = currentSession()?.user;
    let out: Row[] = [];
    if (this.op === "insert" || this.op === "upsert") {
      const items = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((v: Row) => ({ id: uid(), created_at: now(), updated_at: now(), ...(user && !("user_id" in v) ? { user_id: user.id } : {}), ...v }));
      for (const it of items) {
        const i = this.op === "upsert" ? rows.findIndex((r) => r.id === it.id) : -1;
        if (i >= 0) rows[i] = { ...rows[i], ...it }; else rows.push(it);
      }
      out = items; saveDB(db);
    } else if (this.op === "update") {
      rows.forEach((r, i) => { if (this.filters.every((f) => f(r))) { rows[i] = { ...r, ...this.payload, updated_at: now() }; out.push(rows[i]); } });
      saveDB(db);
    } else if (this.op === "delete") {
      out = rows.filter((r) => this.filters.every((f) => f(r)));
      db[this.table] = rows.filter((r) => !out.includes(r)); saveDB(db);
    } else {
      out = rows.filter((r) => this.filters.every((f) => f(r)));
      for (const o of [...this.orders].reverse()) out = [...out].sort((a, b) => (o.asc ? 1 : -1) * cmp(a[o.col], b[o.col]));
      if (this.from_ != null) out = out.slice(this.from_, (this.to_ ?? out.length - 1) + 1);
      if (this.lim != null) out = out.slice(0, this.lim);
      // relações simples: anexa o registro pai (ex.: cliente_id → clientes)
      out = out.map((r) => {
        const extra: Row = {};
        for (const k of Object.keys(r)) if (k.endsWith("_id") && r[k]) {
          const t = k.slice(0, -3) + "s";
          if (db[t]) extra[t] = db[t].find((x) => x.id === r[k]) ?? null;
        }
        return { ...extra, ...r };
      });
    }
    const count = out.length;
    if (this.op !== "select" && !this.returning && this.mode === "many") return { data: null, error: null, count: null, status: 201 };
    if (this.head) return { data: null, error: null, count, status: 200 };
    if (this.mode === "single") return out.length === 1 ? { data: out[0], error: null, count, status: 200 } : { data: null, error: err(out.length ? "Mais de uma linha" : "Nenhum registro"), count, status: 406 };
    if (this.mode === "maybe") return { data: out[0] ?? null, error: null, count, status: 200 };
    return { data: out, error: null, count: this.countOpt ? count : null, status: 200 };
  }
  then<A = any, B = never>(ok?: ((v: any) => A | PromiseLike<A>) | null, bad?: ((e: any) => B | PromiseLike<B>) | null) {
    return new Promise((res) => setTimeout(() => res(this.run()), 60)).then(ok, bad);
  }
}

const unavailable = (what: string) => ({ data: null, error: err(`${what} não funciona no site de teste (precisa do servidor real).`) });

export const demoSupabase: any = {
  auth,
  from: (t: string) => new Query(t),
  async rpc(name: string, args: any) {
    if (name === "has_role") { const s = currentSession(); const u = Object.values(USERS).find((x) => x.id === (args?._user_id ?? s?.user?.id)); return { data: !!u?.admin && (args?._role === "admin" || args?._role === "educador"), error: null }; }
    // Site de teste: os logins de teste têm acesso liberado (assinatura de demonstração).
    if (name === "tem_acesso_app") return { data: !!currentSession(), error: null };
    if (name === "minha_assinatura") {
      const s = currentSession(); const u = Object.values(USERS).find((x) => x.id === s?.user?.id);
      const fim = new Date(Date.now() + 23 * 86400000).toISOString();
      return { data: s ? [{ tem_acesso: true, origem: u?.admin ? "equipe" : "assinatura", status: "active", contrato_meses: 12, fidelidade_ate: new Date(Date.now() + 300 * 86400000).toISOString(), proxima_cobranca: fim, cancela_no_fim: false }] : [], error: null };
    }
    return { data: null, error: null };
  },
  functions: { async invoke(name: string) { return unavailable(`A função "${name}"`); } },
  storage: {
    from: () => ({
      upload: async () => unavailable("Envio de arquivos"),
      download: async () => unavailable("Download de arquivos"),
      list: async () => ({ data: [], error: null }),
      remove: async () => ({ data: [], error: null }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
      createSignedUrl: async () => unavailable("Link de arquivo"),
    }),
  },
  channel: () => ({ on() { return this; }, subscribe() { return this; }, unsubscribe() { /* */ } }),
  removeChannel: () => undefined,
};

export function resetDemoData() { store.del(DB_KEY); }
