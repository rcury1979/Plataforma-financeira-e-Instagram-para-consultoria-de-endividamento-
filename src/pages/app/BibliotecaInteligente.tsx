import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, FileSpreadsheet, Play, Search, ShieldCheck, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const QUERIES_DATA = `
# Biblioteca Inteligente — monte apresentacao

Este módulo permite a gestão automatizada de queries e análise preditiva de dados, focada na otimização de fluxos e identificação de discrepâncias.

**Ambiente:** \`dbw_ctg_prd_001.amil_dw_view\` (principal) · \`provisioned_discovery\` (tabelas externas da equipe)
**Uso:** estas são as **bases-núcleo** do fluxo faturamento → glosa → recurso. Filtros e joins abaixo adiantam o estudo — **adeque conforme a análise**.

---

## 1 — Beneficiário

**O que faz:** custo médico agregado por beneficiário × ano/mês, com perfil (idade, sexo, plano, status, adesão/exclusão) e valores informado / glosado / pago / qtd aprovada.
**Tabelas:** \`fcust_custo\` (c) + \`dbene_beneficiario\` (b) — join por \`DBENE_SK\`.

\`\`\`sql
SELECT
        year(to_date(CAST(c.DTEMP_SK_APRESENTACAO AS STRING), 'yyyyMMdd')) AS anoApresentacao,
        month(to_date(CAST(c.DTEMP_SK_APRESENTACAO AS STRING), 'yyyyMMdd')) AS mesApresentacao,
        b.DBENE_SK                               AS beneficiario,
        b.DBENE_NR_MARCA_OTICA                   AS MO,
        SUM(c.FCUST_VL_INFORMADO)                AS vl_informado,
        SUM(c.FCUST_VL_GLOSADO)                  AS vl_glosado,
        SUM(c.FCUST_VL_APROVADO)                 AS vl_pago
    FROM dbw_ctg_prd_001.amil_dw_view.fcust_custo AS c
    JOIN dbw_ctg_prd_001.amil_dw_view.dbene_beneficiario AS b
      ON b.DBENE_SK = c.DBENE_SK
    WHERE c.DTEMP_SK_APRESENTACAO BETWEEN 20230101 AND 20251031
      AND c.FCUST_NR_ARQUIVAMENTO IS NOT NULL
      AND c.DTICN_CD_GRUPO_TIPO_CONTA = 'A'
    GROUP BY 1, 2, 3, 4
\`\`\`

---

## 2 — População / Vidas

**O que faz:** base de vidas por competência, com perfil do beneficiário e permanência.

\`\`\`sql
SELECT
    fpopu.DTEMP_SK_COMPETENCIA AS Mes_Competencia,
    dbene.DBENE_NM_BENEFICIARIO as nome,
    fpopu.FPOPU_NR_IDADE AS Idade,
    dplan.DPLAN_NM_ABRANGENCIA AS Plano_Abrangencia
FROM dbw_ctg_prd_001.amil_dw_view.fpopu_populacao fpopu
INNER JOIN dbw_ctg_prd_001.amil_dw_view.dplan_plano dplan ON dplan.DPLAN_SK = fpopu.DPLAN_SK
INNER JOIN dbw_ctg_prd_001.amil_dw_view.dbene_beneficiario as dbene ON fpopu.DBENE_SK = dbene.DBENE_SK
WHERE fpopu.DTEMP_SK_COMPETENCIA BETWEEN 20230101 AND 20251031
  AND fpopu.DPRAS_SK = 1
\`\`\`
`;

export default function BibliotecaInteligente() {
  const [activeTab, setActiveTab] = useState("biblioteca");
  const [generating, setGenerating] = useState(false);

  const handleGenerateDashboard = () => {
    setGenerating(true);
    setTimeout(() => {
      try {
        const wb = XLSX.utils.book_new();
        
        // Mock data for the Excel Dashboard
        const summaryData = [
          { Categoria: "Total Informado", Valor: 15450000.50, Qtd: 1250 },
          { Categoria: "Total Glosado", Valor: 2150400.20, Qtd: 450 },
          { Categoria: "Total Pago", Valor: 13299600.30, Qtd: 800 },
          { Categoria: "Taxa de Glosa", Valor: "13.91%", Qtd: "-" },
        ];
        
        const monthlyData = [
          { Mes: "2024-01", Informado: 1200000, Glosado: 150000, Pago: 1050000 },
          { Mes: "2024-02", Informado: 1350000, Glosado: 180000, Pago: 1170000 },
          { Mes: "2024-03", Informado: 1100000, Glosado: 120000, Pago: 980000 },
        ];

        const ws1 = XLSX.utils.json_to_sheet(summaryData);
        const ws2 = XLSX.utils.json_to_sheet(monthlyData);

        XLSX.utils.book_append_sheet(wb, ws1, "Resumo Executivo");
        XLSX.utils.book_append_sheet(wb, ws2, "Evolução Mensal");

        XLSX.writeFile(wb, "Dashboard_Analise_Fraude_Glosa.xlsx");
        toast.success("Dashboard Excel gerado com sucesso!");
      } catch (error) {
        console.error(error);
        toast.error("Erro ao gerar dashboard.");
      } finally {
        setGenerating(false);
      }
    }, 1500);
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="w-8 h-8 text-primary" />
            Biblioteca Inteligente
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestão automatizada de queries e análise preditiva de dados.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2">
            <Search className="w-4 h-4" />
            Buscar Query
          </Button>
          <Button onClick={handleGenerateDashboard} disabled={generating} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <FileSpreadsheet className="w-4 h-4" />
            {generating ? "Processando..." : "Gerar Dashboard Excel"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Automação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Queries montadas automaticamente com base no contexto Databricks/Amil.</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              Inteligência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Conversão imediata de resultados em dashboards analíticos no Excel.</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Filtros de integridade para evitar duplicidade (JOINs otimizados).</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="biblioteca" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="biblioteca">Documentação & Queries</TabsTrigger>
          <TabsTrigger value="executor">Executor Inteligente</TabsTrigger>
        </TabsList>
        <TabsContent value="biblioteca" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual de Consultas — Amil DW</CardTitle>
              <CardDescription>Estrutura núcleo para análise de Glosa e Fraude.</CardDescription>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none min-w-0 [&_pre]:max-w-full [&_pre]:overflow-x-auto">
              <ReactMarkdown>{QUERIES_DATA}</ReactMarkdown>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="executor" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Executor de Processos</CardTitle>
              <CardDescription>Simule a geração de dados e análise automática.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Play className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Pronto para processar</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Clique abaixo para executar as queries inteligentes, analisar as discrepâncias e gerar o relatório final.
                  </p>
                </div>
                <Button onClick={handleGenerateDashboard} size="lg" className="gap-2">
                  <Play className="w-4 h-4" />
                  Executar Fluxo Completo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
