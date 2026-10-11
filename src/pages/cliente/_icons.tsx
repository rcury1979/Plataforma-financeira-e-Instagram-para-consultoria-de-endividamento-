/* Ícones disponíveis para categorias (nome salvo em cli_categorias.icone). */
import {
  Home, ShoppingCart, Utensils, Car, Stethoscope, GraduationCap, Gamepad2, Shirt, CreditCard, Landmark,
  PiggyBank, Folder, Repeat, Gem, Shield, Sparkles, DollarSign, Briefcase, Gift, Heart, Plane, PawPrint,
  Baby, Smartphone, Zap, Droplets, Wifi, Fuel, Dumbbell, Coffee, TrendingUp, Wallet, type LucideIcon,
} from "lucide-react";

export const CAT_ICONS: Record<string, LucideIcon> = {
  casa: Home, mercado: ShoppingCart, alimentacao: Utensils, transporte: Car, saude: Stethoscope,
  educacao: GraduationCap, lazer: Gamepad2, vestuario: Shirt, assinaturas: CreditCard, dividas: Landmark,
  investimentos: PiggyBank, outros: Folder, recorrente: Repeat, dizimo: Gem, seguranca: Shield, beleza: Sparkles,
  salario: DollarSign, renda_extra: Briefcase, presente: Gift, doacao: Heart, viagem: Plane, pet: PawPrint,
  filhos: Baby, celular: Smartphone, energia: Zap, agua: Droplets, internet: Wifi, combustivel: Fuel,
  academia: Dumbbell, cafe: Coffee, rendimentos: TrendingUp, carteira: Wallet,
};

export function CatIcon({ name, className = "h-4 w-4" }: { name?: string | null; className?: string }) {
  const I = (name && CAT_ICONS[name]) || Folder;
  return <I className={className} />;
}

/** Categorias criadas automaticamente para um cliente novo. */
export const CATEGORIAS_PADRAO: { nome: string; tipo: "despesa" | "receita"; icone: string }[] = [
  { nome: "Moradia", tipo: "despesa", icone: "casa" },
  { nome: "Mercado", tipo: "despesa", icone: "mercado" },
  { nome: "Alimentação", tipo: "despesa", icone: "alimentacao" },
  { nome: "Transporte", tipo: "despesa", icone: "transporte" },
  { nome: "Saúde", tipo: "despesa", icone: "saude" },
  { nome: "Educação", tipo: "despesa", icone: "educacao" },
  { nome: "Lazer", tipo: "despesa", icone: "lazer" },
  { nome: "Vestuário", tipo: "despesa", icone: "vestuario" },
  { nome: "Assinaturas", tipo: "despesa", icone: "assinaturas" },
  { nome: "Dívidas", tipo: "despesa", icone: "dividas" },
  { nome: "Investimentos", tipo: "despesa", icone: "investimentos" },
  { nome: "Dízimo e doações", tipo: "despesa", icone: "dizimo" },
  { nome: "Seguros", tipo: "despesa", icone: "seguranca" },
  { nome: "Beleza", tipo: "despesa", icone: "beleza" },
  { nome: "Outros", tipo: "despesa", icone: "outros" },
  { nome: "Salário", tipo: "receita", icone: "salario" },
  { nome: "Renda extra", tipo: "receita", icone: "renda_extra" },
  { nome: "Rendimentos", tipo: "receita", icone: "rendimentos" },
  { nome: "Outras receitas", tipo: "receita", icone: "outros" },
];
