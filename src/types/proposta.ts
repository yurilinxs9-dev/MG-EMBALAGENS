export interface Servico {
  nome: string;
  descricao: string;
  valor_mensal: number;
  valor_setup: number;
  investimento_trafego?: number; // Apenas para Tráfego Pago
  selecionado: boolean;
  temSetup?: boolean; // Indica se esse serviço permite setup
}

// Helper: valores em milheiro convertidos para unitário (preço/1000)
const m = (preco: number) => Number((preco / 1000).toFixed(4));

const padraoBocaPalhaco = (tipo: string, tam: string, gramatura: string, descSilk = "Silk 1 lado, 1 cor") => [
  `Sacola Boca de Palhaço ${tipo}`,
  `Tamanho ${tam} cm`,
  `Gramatura ${gramatura}`,
  descSilk,
].join("\n");

const padraoAlcaFita = (tam: string, tipo = "Alta Densidade") => [
  `Sacola Alça Fita - ${tipo}`,
  `Tamanho ${tam} cm`,
  "Silk 1 lado, 1 cor",
].join("\n");

const padraoCamiseta = (tipo: string, tam: string) => [
  `Sacola Camiseta ${tipo}`,
  `Tamanho ${tam} cm`,
  "Silk 1 lado, 1 cor",
].join("\n");

export const SERVICOS_PADRAO: Servico[] = [
  // ── SACOLAS BOCA DE PALHAÇO — Alta Densidade (AD) ─────────────────────
  { nome: "Boca Vazada AD 16x22x010", descricao: padraoBocaPalhaco("Alta Densidade", "16x22", "010"), valor_mensal: m(490), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Boca Vazada AD 20x30x008", descricao: padraoBocaPalhaco("Alta Densidade", "20x30", "008"), valor_mensal: m(590), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Boca Vazada AD 20x30x012", descricao: padraoBocaPalhaco("Alta Densidade", "20x30", "012"), valor_mensal: m(528), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Boca Vazada AD 25x35x008", descricao: padraoBocaPalhaco("Alta Densidade", "25x35", "008"), valor_mensal: m(705), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Boca Vazada AD 30x40x006", descricao: padraoBocaPalhaco("Alta Densidade", "30x40", "006"), valor_mensal: m(730), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Boca Vazada AD 30x40x008", descricao: padraoBocaPalhaco("Alta Densidade", "30x40", "008"), valor_mensal: m(885), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Boca Vazada AD 30x40x012", descricao: padraoBocaPalhaco("Alta Densidade", "30x40", "012"), valor_mensal: m(816), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Boca Vazada AD 36x48x008", descricao: padraoBocaPalhaco("Alta Densidade", "36x48", "008"), valor_mensal: m(1120), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Boca Vazada AD 40x50x010", descricao: padraoBocaPalhaco("Alta Densidade", "40x50", "010"), valor_mensal: m(1340), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Boca Vazada AD 40x50x012", descricao: padraoBocaPalhaco("Alta Densidade", "40x50", "012"), valor_mensal: m(1550), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Boca Vazada AD 45x60x012", descricao: padraoBocaPalhaco("Alta Densidade", "45x60", "012"), valor_mensal: m(2000), valor_setup: 0, selecionado: false, temSetup: false },

  // ── SACOLAS BOCA DE PALHAÇO — Baixa Densidade (BD) ────────────────────
  { nome: "Boca Vazada BD 16x22x010", descricao: padraoBocaPalhaco("Baixa Densidade", "16x22", "010"), valor_mensal: m(530), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Boca Vazada BD 20x30x010", descricao: padraoBocaPalhaco("Baixa Densidade", "20x30", "010"), valor_mensal: m(665), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Boca Vazada BD 25x35x012", descricao: padraoBocaPalhaco("Baixa Densidade", "25x35", "012"), valor_mensal: m(895), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Boca Vazada BD 30x40x012", descricao: padraoBocaPalhaco("Baixa Densidade", "30x40", "012"), valor_mensal: m(1170), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Boca Vazada BD 36x48x012", descricao: padraoBocaPalhaco("Baixa Densidade", "36x48", "012"), valor_mensal: m(1550), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Boca Vazada BD 40x50x012", descricao: padraoBocaPalhaco("Baixa Densidade", "40x50", "012"), valor_mensal: m(1770), valor_setup: 0, selecionado: false, temSetup: false },

  // ── SACOLAS ALÇA FITA ─────────────────────────────────────────────────
  { nome: "Alça Fita 30x35x013", descricao: padraoAlcaFita("30x35x013"), valor_mensal: m(1480), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Alça Fita 40x40x013", descricao: padraoAlcaFita("40x40x013"), valor_mensal: m(2050), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Alça Fita 45x45x013", descricao: padraoAlcaFita("45x45x013"), valor_mensal: m(2500), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Alça Fita 27x30x015", descricao: padraoAlcaFita("27x30x015"), valor_mensal: m(1418), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Alça Fita 30x35x015", descricao: padraoAlcaFita("30x35x015"), valor_mensal: m(1711), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Alça Fita 40x40x015", descricao: padraoAlcaFita("40x40x015"), valor_mensal: m(2317), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Alça Fita 45x45x015", descricao: padraoAlcaFita("45x45x015"), valor_mensal: m(2726), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Alça Fita BD 30x35x015", descricao: padraoAlcaFita("30x35x015", "Baixa Densidade"), valor_mensal: m(1800), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Alça Fita BD 40x40x015", descricao: padraoAlcaFita("40x40x015", "Baixa Densidade"), valor_mensal: m(2400), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Alça Fita BD 45x45x015", descricao: padraoAlcaFita("45x45x015", "Baixa Densidade"), valor_mensal: m(2840), valor_setup: 0, selecionado: false, temSetup: false },

  // ── SACOLAS CAMISETAS ─────────────────────────────────────────────────
  { nome: "Camiseta Branca 30x40x004", descricao: padraoCamiseta("Branca", "30x40x004"), valor_mensal: m(600), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Camiseta Branca 35x45x004", descricao: padraoCamiseta("Branca", "35x45x004"), valor_mensal: m(690), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Camiseta Branca 40x50x005", descricao: padraoCamiseta("Branca", "40x50x005"), valor_mensal: m(810), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Camiseta Branca 45x60x005", descricao: padraoCamiseta("Branca", "45x60x005"), valor_mensal: m(1050), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Camiseta Branca 50x60x006", descricao: padraoCamiseta("Branca", "50x60x006"), valor_mensal: m(1200), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Camiseta Branca 50x70x006", descricao: padraoCamiseta("Branca", "50x70x006"), valor_mensal: m(1340), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Camiseta Branca 60x80x006", descricao: padraoCamiseta("Branca", "60x80x006"), valor_mensal: m(1809), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Camiseta Branca 70x90x007", descricao: padraoCamiseta("Branca", "70x90x007"), valor_mensal: m(2340), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Camiseta Branca 90x100x007", descricao: padraoCamiseta("Branca", "90x100x007"), valor_mensal: m(3300), valor_setup: 0, selecionado: false, temSetup: false },

  { nome: "Camiseta Colorida 30x40x004", descricao: padraoCamiseta("Colorida", "30x40x004"), valor_mensal: m(645), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Camiseta Colorida 40x50x004", descricao: padraoCamiseta("Colorida", "40x50x004"), valor_mensal: m(895), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Camiseta Colorida 45x60x005", descricao: padraoCamiseta("Colorida", "45x60x005"), valor_mensal: m(1180), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Camiseta Colorida 50x70x006", descricao: padraoCamiseta("Colorida", "50x70x006"), valor_mensal: m(1530), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Camiseta Colorida 60x80x006", descricao: padraoCamiseta("Colorida", "60x80x006"), valor_mensal: m(2100), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Camiseta Colorida 70x90x006", descricao: padraoCamiseta("Colorida", "70x90x006"), valor_mensal: m(2720), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Camiseta Colorida 90x100x006", descricao: padraoCamiseta("Colorida", "90x100x006"), valor_mensal: m(3850), valor_setup: 0, selecionado: false, temSetup: false },

  { nome: "Camiseta BD 30x40x004", descricao: padraoCamiseta("Baixa Densidade", "30x40x004"), valor_mensal: m(1030), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Camiseta BD 40x50x004", descricao: padraoCamiseta("Baixa Densidade", "40x50x004"), valor_mensal: m(1650), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Camiseta BD 45x60x005", descricao: padraoCamiseta("Baixa Densidade", "45x60x005"), valor_mensal: m(2180), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Camiseta BD 50x70x006", descricao: padraoCamiseta("Baixa Densidade", "50x70x006"), valor_mensal: m(3100), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Camiseta BD 60x80x006", descricao: padraoCamiseta("Baixa Densidade", "60x80x006"), valor_mensal: m(4300), valor_setup: 0, selecionado: false, temSetup: false },

  // ── SACOLAS ALÇA CADEADO ──────────────────────────────────────────────
  { nome: "Alça Cadeado 32x49x015", descricao: ["Sacola Alça Cadeado AD", "Tamanho 32x49x015 cm", "Silk 1 lado, 1 cor"].join("\n"), valor_mensal: m(1420), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Alça Cadeado 42x65x015", descricao: ["Sacola Alça Cadeado AD", "Tamanho 42x65x015 cm", "Silk 1 lado, 1 cor"].join("\n"), valor_mensal: m(2230), valor_setup: 0, selecionado: false, temSetup: false },

  // ── GRÁFICA ───────────────────────────────────────────────────────────
  { nome: "Tag 300G P", descricao: ["Tag 300G - Pequeno", "Laminação fosca + verniz localizado"].join("\n"), valor_mensal: m(275), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Tag 300G G", descricao: ["Tag 300G - Grande", "Laminação fosca + verniz localizado"].join("\n"), valor_mensal: m(360), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Tag 250G P", descricao: ["Tag 250G - Pequeno", "Acabamento verniz total frente"].join("\n"), valor_mensal: m(235), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Tag 250G G", descricao: ["Tag 250G - Grande", "Acabamento verniz total frente"].join("\n"), valor_mensal: m(295), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Tag Biju Duplo", descricao: ["Tag Biju duplo"].join("\n"), valor_mensal: m(600), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Adesivo 3,4,5,5x7 cm", descricao: ["Adesivo personalizado", "Tamanhos 3, 4, 5, 5x7 cm"].join("\n"), valor_mensal: m(315), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Cartão Visita 300G LAM+VER", descricao: ["Cartão de Visita 300G", "Laminação + verniz"].join("\n"), valor_mensal: m(270), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Cartão Visita 250G Verniz Total", descricao: ["Cartão de Visita 250G", "Verniz total frente"].join("\n"), valor_mensal: m(170), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Cartão Visita 300G LAM+VER+HOT", descricao: ["Cartão de Visita 300G", "Laminação + verniz + hot stamping"].join("\n"), valor_mensal: m(640), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Cartão Visita 300G Kraft", descricao: ["Cartão de Visita 300G Kraft"].join("\n"), valor_mensal: m(180), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Cartão Visita 300G Agradecimento", descricao: ["Cartão de Visita 300G", "Modelo Agradecimento"].join("\n"), valor_mensal: m(375), valor_setup: 0, selecionado: false, temSetup: false },

  // ── FITAS DE CETIM (preço por rolo) ───────────────────────────────────
  { nome: "Fita Cetim 2cm 50m", descricao: ["Fita de Cetim 2cm", "Rolo 50 metros", "Cores: Branco, Preto, Off, Rosa, Azul, Marrom", "Hot: Dourado, Prata ou Rose Gold"].join("\n"), valor_mensal: 140, valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Fita Cetim 2cm 100m", descricao: ["Fita de Cetim 2cm", "Rolo 100 metros"].join("\n"), valor_mensal: 245, valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Fita Cetim 2cm 200m", descricao: ["Fita de Cetim 2cm", "Rolo 200 metros"].join("\n"), valor_mensal: 490, valor_setup: 0, selecionado: false, temSetup: false },

  // ── PAPEL DE SEDA (preço por kit) ─────────────────────────────────────
  { nome: "Folha de Seda 5kg (750 folhas)", descricao: ["Papel de Seda 5kg", "Aprox. 750 folhas", "Tamanhos: 50x70 / 25x70 / 50x35 / Bobina"].join("\n"), valor_mensal: 840, valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Folha de Seda 10kg (1500 folhas)", descricao: ["Papel de Seda 10kg", "Aprox. 1500 folhas"].join("\n"), valor_mensal: 960, valor_setup: 0, selecionado: false, temSetup: false },

  // ── ENVELOPES DE ENVIO (unitário) ─────────────────────────────────────
  { nome: "Envelope de Envio 32x40", descricao: ["Envelope BD 32x40 cm", "Silk 2 lados (mín. 250 unidades)"].join("\n"), valor_mensal: 1.10, valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Envelope de Envio 40x50", descricao: ["Envelope BD 40x50 cm", "Silk 2 lados (mín. 250 unidades)"].join("\n"), valor_mensal: 1.70, valor_setup: 0, selecionado: false, temSetup: false },

  // ── SACO PP DE CAMISARIA (milheiro) ───────────────────────────────────
  { nome: "Saco PP 35x45x6", descricao: ["Saco PP transparente", "Tamanho 35x45 + 6cm fronha", "Personalização 1 lado, 1 cor"].join("\n"), valor_mensal: m(540), valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Saco PP 25x35x5", descricao: ["Saco PP transparente", "Tamanho 25x35 + 5cm fronha", "Personalização 1 lado, 1 cor"].join("\n"), valor_mensal: m(498), valor_setup: 0, selecionado: false, temSetup: false },

  // ── SACOLAS DE PAPEL POR SILK (preço unidade — faixa 100un) ───────────
  { nome: "Sacola Papel M Kraft 24x10x31", descricao: ["Sacola Papel Personalizada", "Tamanho M - Kraft 24x10x31", "Alça Nylon", "Mín. 100 unidades"].join("\n"), valor_mensal: 3.65, valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Sacola Papel M Preta 24x10x31", descricao: ["Sacola Papel Personalizada", "Tamanho M - Preta 24x10x31", "Alça Nylon"].join("\n"), valor_mensal: 3.75, valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Sacola Papel M Branca 24x10x31", descricao: ["Sacola Papel Personalizada", "Tamanho M - Branca 24x10x31", "Alça Nylon"].join("\n"), valor_mensal: 3.90, valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Sacola Papel GG Kraft 35x10x35", descricao: ["Sacola Papel Personalizada", "Tamanho GG - Kraft 35x10x35", "Alça Nylon"].join("\n"), valor_mensal: 4.25, valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Sacola Papel GG Preta 35x10x35", descricao: ["Sacola Papel Personalizada", "Tamanho GG - Preta 35x10x35", "Alça Nylon"].join("\n"), valor_mensal: 4.40, valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Sacola Papel GG Branca 35x10x35", descricao: ["Sacola Papel Personalizada", "Tamanho GG - Branca 35x10x35", "Alça Nylon"].join("\n"), valor_mensal: 4.65, valor_setup: 0, selecionado: false, temSetup: false },

  // ── SACOLAS LISAS AVULSAS (unitário) ──────────────────────────────────
  { nome: "Sacola Lisa - Boca de Palhaço", descricao: ["Sacola lisa avulsa", "Modelo Boca de Palhaço"].join("\n"), valor_mensal: 1.25, valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Sacola Lisa - Alça Fita", descricao: ["Sacola lisa avulsa", "Modelo Alça Fita"].join("\n"), valor_mensal: 1.85, valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Sacola Lisa - Sacola de Papel", descricao: ["Sacola lisa avulsa", "Modelo Sacola de Papel"].join("\n"), valor_mensal: 2.50, valor_setup: 0, selecionado: false, temSetup: false },
  { nome: "Sacola Lisa - Envelope de Envio", descricao: ["Sacola lisa avulsa", "Modelo Envelope de Envio"].join("\n"), valor_mensal: 1.25, valor_setup: 0, selecionado: false, temSetup: false },
];

export type StatusProposta =
  | "novo_lead"
  | "proposta_enviada"
  | "em_negociacao"
  | "fechado"
  | "perdido";

export const STATUS_LABELS: Record<StatusProposta, string> = {
  novo_lead: "Novo Lead",
  proposta_enviada: "Proposta Enviada",
  em_negociacao: "Em Negociação",
  fechado: "Fechado",
  perdido: "Perdido",
};

export const STATUS_COLORS: Record<StatusProposta, string> = {
  novo_lead: "bg-blue-50 text-blue-700 border-blue-200",
  proposta_enviada: "bg-amber-50 text-amber-700 border-amber-200",
  em_negociacao: "bg-purple-50 text-purple-700 border-purple-200",
  fechado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  perdido: "bg-red-50 text-red-700 border-red-200",
};

export interface PropostaDB {
  id: string;
  cliente_nome: string;
  cliente_empresa: string | null;
  cliente_whatsapp: string | null;
  cliente_email: string | null;
  cliente_endereco?: string | null;
  cliente_cpf_cnpj?: string | null;
  status: StatusProposta;
  valor_mensal: number;
  valor_setup: number;
  valor_total: number;
  desconto_tipo: string | null;
  desconto_valor: number | null;
  observacoes: string | null;
  criado_por: string | null;
  public_token: string | null;
  created_at: string;
  updated_at: string;
  proposta_servicos?: PropostaServicoDB[];
}

export type AtividadeTipo = 'nota' | 'ligacao' | 'reuniao' | 'status' | 'envio' | 'aceite' | 'visualizacao';

export interface AtividadeDB {
  id: string;
  proposta_id: string;
  tipo: AtividadeTipo;
  descricao: string | null;
  criado_por: string | null;
  created_at: string;
}

export interface PropostaServicoDB {
  id: string;
  proposta_id: string;
  servico_nome: string;
  descricao: string | null;
  valor_mensal: number;
  valor_setup: number;
  quantidade?: number;
  created_at: string;
}
