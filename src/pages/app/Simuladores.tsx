import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  TrendingUp, Building2, User, Home as HomeIcon, Car, ChevronRight, LineChart as LineIcon, ArrowLeft,
} from "lucide-react";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

type Calc = "investimentos" | "financiamento" | "aposentadoria" | "aluguel" | "consorcio" | null;

const cards: { id: Exclude<Calc, null>; icon: any; titulo: string; desc: string }[] = [
  { id: "investimentos", icon: TrendingUp, titulo: "Investimentos", desc: "Quanto rende seu dinheiro ao longo do tempo" },
  { id: "financiamento", icon: Building2, titulo: "Financiamento", desc: "Parcela e custo total de um financiamento" },
  { id: "aposentadoria", icon: User, titulo: "Aposentadoria", desc: "Quanto guardar para se aposentar bem" },
  { id: "aluguel", icon: HomeIcon, titulo: "Aluguel vs Casa Própria", desc: "Compensa comprar ou alugar?" },
  { id: "consorcio", icon: Car, titulo: "Financiamento vs Consórcio", desc: "Qual sai mais barato?" },
];

export default function Simuladores() {
  const [ativa, setAtiva] = useState<Calc>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-serif font-semibold tracking-tight">Simuladores</h1>
        <p className="text-sm text-muted-foreground mt-1">Toque para abrir e simular cenários financeiros.</p>
      </div>

      <div className="space-y-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              onClick={() => setAtiva(c.id)}
              className="w-full text-left"
            >
              <Card className="p-4 flex items-center gap-3 hover:border-primary/40 transition">
                <div className="h-11 w-11 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{c.titulo}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.desc}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Card>
            </button>
          );
        })}
      </div>

      <Card className="p-4">
        <Link to="/app/mais" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <LineIcon className="h-4 w-4" />
          Ver projeção baseada nos seus lançamentos
          <ArrowLeft className="h-4 w-4 ml-auto rotate-180" />
        </Link>
      </Card>

      <Dialog open={!!ativa} onOpenChange={(v) => !v && setAtiva(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{cards.find((c) => c.id === ativa)?.titulo}</DialogTitle>
          </DialogHeader>
          {ativa === "investimentos" && <CalcInvestimentos />}
          {ativa === "financiamento" && <CalcFinanciamento />}
          {ativa === "aposentadoria" && <CalcAposentadoria />}
          {ativa === "aluguel" && <CalcAluguel />}
          {ativa === "consorcio" && <CalcConsorcio />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Calculadoras ---------- */

function Field({ label, value, onChange, sufix }: { label: string; value: string; onChange: (v: string) => void; sufix?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <Input value={value} onChange={(e) => onChange(e.target.value)} inputMode="decimal" />
        {sufix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{sufix}</span>}
      </div>
    </div>
  );
}

function Result({ label, value, tone = "primary" }: { label: string; value: string; tone?: "primary" | "success" | "danger" }) {
  const c = tone === "success" ? "text-[hsl(var(--success))]" : tone === "danger" ? "text-destructive" : "text-primary";
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${c}`}>{value}</div>
    </div>
  );
}

function CalcInvestimentos() {
  const [inicial, setInicial] = useState("1000");
  const [aporte, setAporte] = useState("500");
  const [taxa, setTaxa] = useState("1");
  const [meses, setMeses] = useState("120");
  const i = Number(taxa) / 100;
  const n = Number(meses);
  const p = Number(inicial);
  const pmt = Number(aporte);
  const montante = p * Math.pow(1 + i, n) + pmt * ((Math.pow(1 + i, n) - 1) / (i || 1e-9));
  const investido = p + pmt * n;
  const juros = montante - investido;
  return (
    <div className="space-y-3">
      <Field label="Aporte inicial" value={inicial} onChange={setInicial} sufix="R$" />
      <Field label="Aporte mensal" value={aporte} onChange={setAporte} sufix="R$" />
      <Field label="Taxa mensal" value={taxa} onChange={setTaxa} sufix="%" />
      <Field label="Meses" value={meses} onChange={setMeses} />
      <div className="grid grid-cols-2 gap-2 pt-2">
        <Result label="Montante" value={brl(montante)} tone="success" />
        <Result label="Investido" value={brl(investido)} />
        <Result label="Juros ganhos" value={brl(juros)} tone="success" />
        <Result label="Prazo" value={`${Math.round(n / 12)} anos`} />
      </div>
    </div>
  );
}

function CalcFinanciamento() {
  const [valor, setValor] = useState("300000");
  const [parcelas, setParcelas] = useState("360");
  const [taxa, setTaxa] = useState("1");
  const pv = Number(valor);
  const n = Number(parcelas);
  const i = Number(taxa) / 100;
  const pmt = i === 0 ? pv / n : (pv * i) / (1 - Math.pow(1 + i, -n));
  const total = pmt * n;
  const juros = total - pv;
  return (
    <div className="space-y-3">
      <Field label="Valor financiado" value={valor} onChange={setValor} sufix="R$" />
      <Field label="Nº de parcelas" value={parcelas} onChange={setParcelas} />
      <Field label="Juros ao mês" value={taxa} onChange={setTaxa} sufix="%" />
      <div className="grid grid-cols-2 gap-2 pt-2">
        <Result label="Parcela" value={brl(pmt)} tone="primary" />
        <Result label="Total pago" value={brl(total)} tone="danger" />
        <Result label="Juros pagos" value={brl(juros)} tone="danger" />
        <Result label="Prazo" value={`${Math.round(n / 12)} anos`} />
      </div>
    </div>
  );
}

function CalcAposentadoria() {
  const [idade, setIdade] = useState("30");
  const [aposentar, setAposentar] = useState("60");
  const [gasto, setGasto] = useState("5000");
  const [taxa, setTaxa] = useState("0.5");
  const anos = Math.max(0, Number(aposentar) - Number(idade));
  const meses = anos * 12;
  const gastoMensal = Number(gasto);
  const i = Number(taxa) / 100;
  // patrimônio necessário para renda perpétua real
  const patrimonio = gastoMensal / (i || 1e-9);
  const aporteNecessario = i === 0 ? patrimonio / meses : (patrimonio * i) / (Math.pow(1 + i, meses) - 1);
  return (
    <div className="space-y-3">
      <Field label="Idade atual" value={idade} onChange={setIdade} />
      <Field label="Idade para aposentar" value={aposentar} onChange={setAposentar} />
      <Field label="Gasto mensal desejado" value={gasto} onChange={setGasto} sufix="R$" />
      <Field label="Rentabilidade real ao mês" value={taxa} onChange={setTaxa} sufix="%" />
      <div className="grid grid-cols-2 gap-2 pt-2">
        <Result label="Patrimônio alvo" value={brl(patrimonio)} tone="success" />
        <Result label="Aporte mensal" value={brl(aporteNecessario)} tone="primary" />
        <Result label="Anos para acumular" value={`${anos} anos`} />
        <Result label="Renda mensal alvo" value={brl(gastoMensal)} />
      </div>
    </div>
  );
}

function CalcAluguel() {
  const [aluguel, setAluguel] = useState("2500");
  const [imovel, setImovel] = useState("500000");
  const [entrada, setEntrada] = useState("100000");
  const [taxa, setTaxa] = useState("0.9");
  const [prazo, setPrazo] = useState("360");
  const [rendimento, setRendimento] = useState("0.7");
  const [anos, setAnos] = useState("10");

  const pv = Number(imovel) - Number(entrada);
  const i = Number(taxa) / 100;
  const n = Number(prazo);
  const parcela = i === 0 ? pv / n : (pv * i) / (1 - Math.pow(1 + i, -n));
  const meses = Number(anos) * 12;
  const custoComprar = Number(entrada) + parcela * Math.min(meses, n);

  // Alugando: paga aluguel e investe entrada + diferença
  const ir = Number(rendimento) / 100;
  const diff = Math.max(0, parcela - Number(aluguel));
  const investAcumulado =
    Number(entrada) * Math.pow(1 + ir, meses) +
    diff * ((Math.pow(1 + ir, meses) - 1) / (ir || 1e-9));
  const custoAlugar = Number(aluguel) * meses - investAcumulado;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Aluguel/mês" value={aluguel} onChange={setAluguel} sufix="R$" />
        <Field label="Valor do imóvel" value={imovel} onChange={setImovel} sufix="R$" />
        <Field label="Entrada" value={entrada} onChange={setEntrada} sufix="R$" />
        <Field label="Juros mês (financ.)" value={taxa} onChange={setTaxa} sufix="%" />
        <Field label="Prazo (meses)" value={prazo} onChange={setPrazo} />
        <Field label="Rend. mês (aplicação)" value={rendimento} onChange={setRendimento} sufix="%" />
        <Field label="Horizonte (anos)" value={anos} onChange={setAnos} />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2">
        <Result label="Parcela financ." value={brl(parcela)} />
        <Result label="Comprando" value={brl(custoComprar)} tone={custoComprar < custoAlugar ? "success" : "danger"} />
        <Result label="Alugando" value={brl(custoAlugar)} tone={custoAlugar < custoComprar ? "success" : "danger"} />
        <Result label="Diferença" value={brl(Math.abs(custoComprar - custoAlugar))} />
      </div>
    </div>
  );
}

function CalcConsorcio() {
  const [valor, setValor] = useState("60000");
  const [prazo, setPrazo] = useState("60");
  const [juros, setJuros] = useState("1.5");
  const [admin, setAdmin] = useState("18");

  const pv = Number(valor);
  const n = Number(prazo);
  const i = Number(juros) / 100;
  const parcelaFin = i === 0 ? pv / n : (pv * i) / (1 - Math.pow(1 + i, -n));
  const totalFin = parcelaFin * n;

  const totalCon = pv * (1 + Number(admin) / 100);
  const parcelaCon = totalCon / n;

  return (
    <div className="space-y-3">
      <Field label="Valor do bem" value={valor} onChange={setValor} sufix="R$" />
      <Field label="Prazo (meses)" value={prazo} onChange={setPrazo} />
      <Field label="Juros mês (financ.)" value={juros} onChange={setJuros} sufix="%" />
      <Field label="Taxa administração (consórcio)" value={admin} onChange={setAdmin} sufix="%" />
      <div className="grid grid-cols-2 gap-2 pt-2">
        <Result label="Parcela financ." value={brl(parcelaFin)} />
        <Result label="Parcela consórcio" value={brl(parcelaCon)} />
        <Result label="Total financ." value={brl(totalFin)} tone={totalFin < totalCon ? "success" : "danger"} />
        <Result label="Total consórcio" value={brl(totalCon)} tone={totalCon < totalFin ? "success" : "danger"} />
      </div>
      <p className="text-[11px] text-muted-foreground pt-1">
        Consórcio não cobra juros mas cobra taxa de administração e não há acesso imediato ao bem (contemplação por sorteio ou lance).
      </p>
    </div>
  );
}
