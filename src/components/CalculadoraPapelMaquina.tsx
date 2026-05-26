import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RotateCcw } from "lucide-react";
import {
  SACOLAS_HORIZONTAL, SACOLAS_VERTICAL,
  PAPEIS_LABELS,
  EXTRAS, ACRESCIMO_500UN_PCT,
  type OrientacaoSacola, type PapelTipo, type AcabamentoTipo, type SacolaPapelMaquina,
} from "@/types/papelMaquina";

export interface ItemCalculado {
  nome: string;
  descricao: string;
  valorUnitario: number;
  quantidade: number;
}

export interface PagamentoInfo {
  aVista: number;
  parcelas: number;
  valorParcela: number;
  comJuros: boolean;
  taxaJuros?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onGerar: (items: ItemCalculado[], pagamento: PagamentoInfo) => Promise<void> | void;
  onAdicionar?: (items: ItemCalculado[]) => void;
  loading?: boolean;
}

type Faixa = { id: string; quantidade: number; acrescimo500: boolean };

const newFaixa = (quantidade = 1000, acrescimo500 = false): Faixa => ({
  id: (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  quantidade,
  acrescimo500,
});

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const ALL_ACABAMENTOS: { key: AcabamentoTipo; label: string }[] = [
  { key: "PLAST_500", label: "Plastificação 500un" },
  { key: "PLAST_1000", label: "Plastificação 1000un" },
  { key: "LAMIN_500", label: "Laminação 500un" },
  { key: "LAMIN_1000", label: "Laminação 1000un" },
  { key: "VERNIZ_LOC", label: "Verniz Localizado" },
];

export default function CalculadoraPapelMaquina({ open, onClose, onGerar, onAdicionar, loading }: Props) {
  const [orientacao, setOrientacao] = useState<OrientacaoSacola>("horizontal");
  const [medidaIdx, setMedidaIdx] = useState<string>("");
  const [papel, setPapel] = useState<PapelTipo>("AP180");

  const [faixas, setFaixas] = useState<Faixa[]>([newFaixa(1000, false)]);

  const [papelValorOverride, setPapelValorOverride] = useState<number | null>(null);

  const [acabamentosSel, setAcabamentosSel] = useState<Set<AcabamentoTipo>>(new Set());
  const [acabamentosVal, setAcabamentosVal] = useState<Partial<Record<AcabamentoTipo, number>>>({});

  const [corQty, setCorQty] = useState(0);
  const [corValor, setCorValor] = useState<number | null>(null);

  const [ilhos, setIlhos] = useState(false);
  const [ilhosValor, setIlhosValor] = useState<number>(EXTRAS.ILHOS);

  const [gorgurao, setGorgurao] = useState<"" | "pb" | "colorido">("");
  const [gorguraoValor, setGorguraoValor] = useState<number | null>(null);

  const [flat, setFlat] = useState<"" | "pb" | "colorido">("");
  const [flatValor, setFlatValor] = useState<number | null>(null);

  const [policromia, setPolicromia] = useState(false);
  const [policromiaValor, setPolicromiaValor] = useState<number>(EXTRAS.POLICROMIA);

  const [descricao, setDescricao] = useState("");
  const [descricaoAuto, setDescricaoAuto] = useState(true);

  // Pagamento — cartão usa total calculado; à vista permite desconto/override
  const [aVistaOverride, setAVistaOverride] = useState<number | null>(null);
  const [descontoAVistaPct, setDescontoAVistaPct] = useState<number>(0);
  const [parcelas, setParcelas] = useState<number>(6);
  const [comJuros, setComJuros] = useState<boolean>(false);
  const [taxaJuros, setTaxaJuros] = useState<number>(2.5);

  const sacolas = orientacao === "horizontal" ? SACOLAS_HORIZONTAL : SACOLAS_VERTICAL;
  const sacola = useMemo<SacolaPapelMaquina | null>(() => {
    if (medidaIdx === "") return null;
    const idx = parseInt(medidaIdx);
    return Number.isFinite(idx) ? sacolas[idx] ?? null : null;
  }, [sacolas, medidaIdx]);

  // Reset overrides ao trocar de medida/papel
  useEffect(() => {
    setPapelValorOverride(null);
    setAcabamentosVal({});
    setCorValor(null);
    setGorguraoValor(null);
    setFlatValor(null);
    setIlhosValor(EXTRAS.ILHOS);
    setPolicromiaValor(EXTRAS.POLICROMIA);
  }, [medidaIdx, papel]);

  const papelValor = useMemo(() => {
    if (papelValorOverride != null) return papelValorOverride;
    return sacola?.papeis[papel] ?? null;
  }, [papelValorOverride, sacola, papel]);

  const acabamentoValor = (key: AcabamentoTipo): number => {
    const ov = acabamentosVal[key];
    if (ov != null) return ov;
    return sacola?.acabamentos[key] ?? 0;
  };

  const gorguraoValorAtual = gorguraoValor ?? (gorgurao === "pb" ? EXTRAS.GORGURAO_PB : EXTRAS.GORGURAO_COLORIDO);
  const flatValorAtual = flatValor ?? (flat === "pb" ? EXTRAS.FLAT_PB : EXTRAS.FLAT_COLORIDO);
  const corValorPara = (qty: number) => corValor ?? (qty >= 5000 ? EXTRAS.COR_5000_MAIS : EXTRAS.COR_ATE_5000);

  type FaixaCalc = { faixa: Faixa; unit: number; total: number; qty: number; breakdown: string[] };

  const calculo = useMemo(() => {
    if (!sacola) return null;
    if (papelValor == null)
      return { erro: `${PAPEIS_LABELS[papel]} indisponível para medida ${sacola.medida}` } as const;
    if (faixas.length === 0) return { erro: "Adicione ao menos uma faixa de quantidade" } as const;

    const porFaixa: FaixaCalc[] = faixas.map((f) => {
      let unit = papelValor;
      const breakdown: string[] = [`Papel ${PAPEIS_LABELS[papel]}: R$ ${papelValor.toFixed(2)}`];

      for (const ac of ALL_ACABAMENTOS) {
        if (acabamentosSel.has(ac.key)) {
          const v = acabamentoValor(ac.key);
          unit += v;
          breakdown.push(`${ac.label}: +R$ ${v.toFixed(2)}`);
        }
      }

      if (corQty > 0) {
        const cv = corValorPara(f.quantidade);
        const add = corQty * cv;
        unit += add;
        breakdown.push(`${corQty} cor(es) × R$ ${cv.toFixed(2)}: +R$ ${add.toFixed(2)}`);
      }
      if (ilhos) { unit += ilhosValor; breakdown.push(`Ilhós: +R$ ${ilhosValor.toFixed(2)}`); }
      if (gorgurao) { unit += gorguraoValorAtual; breakdown.push(`Gorgurão ${gorgurao === "pb" ? "P/B" : "Colorido"}: +R$ ${gorguraoValorAtual.toFixed(2)}`); }
      if (flat) { unit += flatValorAtual; breakdown.push(`Flat ${flat === "pb" ? "P/B" : "Colorido"}: +R$ ${flatValorAtual.toFixed(2)}`); }
      if (policromia) { unit += policromiaValor; breakdown.push(`Policromia: +R$ ${policromiaValor.toFixed(2)}`); }

      if (f.acrescimo500) {
        const acresc = unit * ACRESCIMO_500UN_PCT;
        breakdown.push(`Acréscimo 500un (+25%): +R$ ${acresc.toFixed(2)}`);
        unit += acresc;
      }

      const qty = Math.max(1, Math.floor(f.quantidade) || 1);
      return { faixa: f, unit, total: unit * qty, qty, breakdown };
    });

    const total = porFaixa.reduce((s, fc) => s + fc.total, 0);
    return { porFaixa, total } as const;
  }, [sacola, papel, papelValor, acabamentosSel, acabamentosVal, corQty, corValor, ilhos, ilhosValor, gorgurao, gorguraoValorAtual, flat, flatValorAtual, policromia, policromiaValor, faixas]);

  const totalCalc = calculo && !("erro" in calculo) ? calculo.total : 0;
  const aVistaValor = aVistaOverride ?? (totalCalc * (1 - (descontoAVistaPct || 0) / 100));
  const cartaoValor = totalCalc;

  const valorParcela = useMemo(() => {
    if (parcelas <= 1) return cartaoValor;
    if (!comJuros || taxaJuros <= 0) return cartaoValor / parcelas;
    const i = taxaJuros / 100;
    return (cartaoValor * (i * Math.pow(1 + i, parcelas))) / (Math.pow(1 + i, parcelas) - 1);
  }, [cartaoValor, parcelas, comJuros, taxaJuros]);

  const totalParceladoComJuros = valorParcela * parcelas;

  const descricaoBaseline = useMemo(() => {
    if (!sacola) return "";
    const detalhes: string[] = [];
    for (const ac of ALL_ACABAMENTOS) {
      if (acabamentosSel.has(ac.key)) detalhes.push(ac.label);
    }
    if (corQty > 0) detalhes.push(`${corQty} cor(es) extra`);
    if (ilhos) detalhes.push("Ilhós");
    if (gorgurao) detalhes.push(`Alça Gorgurão ${gorgurao === "pb" ? "P/B" : "Colorida"}`);
    if (flat) detalhes.push(`Alça Flat ${flat === "pb" ? "P/B" : "Colorida"}`);
    if (policromia) detalhes.push("Policromia 4 cores");

    const linhas = [
      `Sacola Papel ${orientacao === "horizontal" ? "Horizontal" : "Vertical"}`,
      `Tamanho ${sacola.medida} cm`,
      `Papel ${PAPEIS_LABELS[papel]}`,
    ];
    if (detalhes.length) linhas.push(`Acabamentos: ${detalhes.join(", ")}`);
    return linhas.join("\n");
  }, [sacola, papel, orientacao, acabamentosSel, corQty, ilhos, gorgurao, flat, policromia]);

  useEffect(() => {
    if (descricaoAuto) setDescricao(descricaoBaseline);
  }, [descricaoBaseline, descricaoAuto]);

  const reset = () => {
    setMedidaIdx("");
    setFaixas([newFaixa(1000, false)]);
    setPapelValorOverride(null);
    setAcabamentosSel(new Set());
    setAcabamentosVal({});
    setCorQty(0);
    setCorValor(null);
    setIlhos(false);
    setIlhosValor(EXTRAS.ILHOS);
    setGorgurao("");
    setGorguraoValor(null);
    setFlat("");
    setFlatValor(null);
    setPolicromia(false);
    setPolicromiaValor(EXTRAS.POLICROMIA);
    setDescricao("");
    setDescricaoAuto(true);
    setAVistaOverride(null);
    setDescontoAVistaPct(0);
    setParcelas(6);
    setComJuros(false);
    setTaxaJuros(2.5);
  };

  const buildItems = (): ItemCalculado[] => {
    if (!sacola || !calculo || "erro" in calculo) return [];
    const baseDesc = descricao.trim() || descricaoBaseline;
    return calculo.porFaixa.map((fc) => ({
      nome: `Sacola Papel ${PAPEIS_LABELS[papel]} ${sacola.medida} — ${fc.qty}un`,
      descricao: `${baseDesc}\nFaixa ${fc.qty}un${fc.faixa.acrescimo500 ? " (+25%)" : ""}`,
      valorUnitario: Number(fc.unit.toFixed(4)),
      quantidade: fc.qty,
    }));
  };

  const handleGerar = async () => {
    const items = buildItems();
    if (items.length === 0) return;
    await onGerar(items, {
      aVista: Number(aVistaValor.toFixed(2)),
      parcelas,
      valorParcela: Number(valorParcela.toFixed(2)),
      comJuros,
      taxaJuros: comJuros ? taxaJuros : undefined,
    });
    reset();
  };

  const handleAdicionar = () => {
    const items = buildItems();
    if (items.length === 0) return;
    onAdicionar?.(items);
    reset();
    onClose();
  };

  const updateFaixa = (id: string, patch: Partial<Faixa>) => {
    setFaixas((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };
  const removeFaixa = (id: string) => setFaixas((prev) => prev.filter((f) => f.id !== id));
  const addFaixa = (qty: number) => setFaixas((prev) => [...prev, newFaixa(qty, qty > 0 && qty < 1000)]);

  const toggleAcabamento = (key: AcabamentoTipo, checked: boolean) => {
    setAcabamentosSel((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calculadora — Sacola Papel Máquina</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Valores pré-preenchidos pela tabela. Tudo é editável.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Orientação</Label>
            <RadioGroup
              value={orientacao}
              onValueChange={(v) => { setOrientacao(v as OrientacaoSacola); setMedidaIdx(""); }}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="horizontal" id="o-h" />
                <Label htmlFor="o-h" className="font-normal cursor-pointer">Horizontal</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="vertical" id="o-v" />
                <Label htmlFor="o-v" className="font-normal cursor-pointer">Vertical</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Medida {sacola && <span className="text-muted-foreground text-xs">(Grupo {sacola.grupo})</span>}</Label>
              <Select value={medidaIdx} onValueChange={setMedidaIdx}>
                <SelectTrigger><SelectValue placeholder="Escolha a medida" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {sacolas.map((s, i) => (
                    <SelectItem key={i} value={String(i)}>{s.medida} — G{s.grupo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Papel</Label>
              <Select value={papel} onValueChange={(v) => setPapel(v as PapelTipo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PAPEIS_LABELS) as PapelTipo[]).map((p) => {
                    const preco = sacola?.papeis[p];
                    const indisponivel = sacola != null && preco == null;
                    return (
                      <SelectItem key={p} value={p} disabled={indisponivel}>
                        {PAPEIS_LABELS[p]}
                        {sacola && (indisponivel ? " — indisponível" : ` — R$ ${preco!.toFixed(2)}`)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {sacola && (
            <>
              {/* Valor do papel — editável */}
              <div className="grid gap-3 md:grid-cols-2 p-3 rounded-lg border bg-muted/30">
                <div className="space-y-1">
                  <Label className="text-sm">Valor unit. papel (R$)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={papelValor ?? ""}
                      onChange={(e) => setPapelValorOverride(Number(e.target.value) || 0)}
                      className="text-sm"
                    />
                    {papelValorOverride != null && (
                      <button
                        type="button"
                        onClick={() => setPapelValorOverride(null)}
                        className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                        title="Restaurar valor da tabela"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Faixas de quantidade</Label>
                    <div className="flex gap-1">
                      {[500, 1000, 5000].map((q) => (
                        <button
                          type="button"
                          key={q}
                          onClick={() => addFaixa(q)}
                          className="px-2 py-1 rounded text-xs border bg-white border-neutral-300 hover:border-red-400"
                          title={`Adicionar faixa ${q}un`}
                        >
                          + {q}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => addFaixa(1000)}
                        className="px-2 py-1 rounded text-xs border bg-white border-neutral-300 hover:border-red-400"
                      >
                        + custom
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {faixas.map((f, idx) => (
                      <div key={f.id} className="flex items-center gap-2 p-2 rounded border bg-white/60">
                        <span className="text-xs text-muted-foreground w-6">#{idx + 1}</span>
                        <Input
                          type="number"
                          min={1}
                          value={f.quantidade}
                          onChange={(e) => updateFaixa(f.id, {
                            quantidade: Math.max(1, Number(e.target.value) || 1),
                            acrescimo500: (Number(e.target.value) || 0) > 0 && (Number(e.target.value) || 0) < 1000,
                          })}
                          className="text-sm h-8 w-24"
                        />
                        <span className="text-xs text-muted-foreground">un</span>
                        <label className="flex items-center gap-1 text-xs cursor-pointer">
                          <Checkbox
                            checked={f.acrescimo500}
                            onCheckedChange={(c) => updateFaixa(f.id, { acrescimo500: !!c })}
                          />
                          +25% (500un)
                        </label>
                        <div className="flex-1" />
                        {faixas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFaixa(f.id)}
                            className="text-xs text-red-600 hover:text-red-700 px-1"
                            title="Remover faixa"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
                <Label className="font-semibold">Acabamentos (todos editáveis)</Label>
                {ALL_ACABAMENTOS.map((ac) => {
                  const valorTabela = sacola.acabamentos[ac.key];
                  const valorAtual = acabamentoValor(ac.key);
                  const indisponivel = valorTabela == null && !acabamentosVal[ac.key];
                  return (
                    <div key={ac.key} className="flex items-center gap-2">
                      <Checkbox
                        checked={acabamentosSel.has(ac.key)}
                        onCheckedChange={(c) => toggleAcabamento(ac.key, !!c)}
                        id={`ac-${ac.key}`}
                      />
                      <Label htmlFor={`ac-${ac.key}`} className="font-normal text-sm cursor-pointer flex-1">
                        {ac.label}
                        {indisponivel && <span className="text-xs text-muted-foreground ml-1">(sem tabela)</span>}
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={valorAtual}
                        onChange={(e) =>
                          setAcabamentosVal((prev) => ({ ...prev, [ac.key]: Number(e.target.value) || 0 }))
                        }
                        className="w-24 text-xs h-8"
                        disabled={!acabamentosSel.has(ac.key)}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                <Label className="font-semibold">Extras (qty e valores editáveis)</Label>

                <div className="grid gap-2 grid-cols-[1fr_auto_auto] items-center">
                  <Label className="text-sm font-normal">
                    Cores adicionais
                    <span className="text-xs text-muted-foreground ml-1">
                      (sugerido por faixa: R$ {EXTRAS.COR_ATE_5000.toFixed(2)} até 5000un · R$ {EXTRAS.COR_5000_MAIS.toFixed(2)} a partir de 5000un)
                    </span>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={corQty}
                    onChange={(e) => setCorQty(Math.max(0, Number(e.target.value) || 0))}
                    className="w-16 text-xs h-8"
                    placeholder="qty"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={corValor ?? ""}
                    onChange={(e) => setCorValor(e.target.value === "" ? null : (Number(e.target.value) || 0))}
                    className="w-20 text-xs h-8"
                    placeholder={`auto`}
                  />
                </div>

                <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={ilhos} onCheckedChange={(c) => setIlhos(!!c)} id="ilhos" />
                    <Label htmlFor="ilhos" className="font-normal text-sm cursor-pointer">Ilhós</Label>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={ilhosValor}
                    onChange={(e) => setIlhosValor(Number(e.target.value) || 0)}
                    className="w-20 text-xs h-8"
                    disabled={!ilhos}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm">Alça Gorgurão</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={gorguraoValorAtual}
                      onChange={(e) => setGorguraoValor(Number(e.target.value) || 0)}
                      className="w-20 text-xs h-8"
                      disabled={!gorgurao}
                    />
                  </div>
                  <div className="flex gap-2">
                    {([["", "Nenhum"], ["pb", "P/B"], ["colorido", "Colorido"]] as const).map(([v, l]) => (
                      <button
                        type="button"
                        key={v}
                        onClick={() => { setGorgurao(v); setGorguraoValor(null); }}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                          gorgurao === v
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white text-neutral-700 border-neutral-300 hover:border-red-400"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm">Alça Flat</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={flatValorAtual}
                      onChange={(e) => setFlatValor(Number(e.target.value) || 0)}
                      className="w-20 text-xs h-8"
                      disabled={!flat}
                    />
                  </div>
                  <div className="flex gap-2">
                    {([["", "Nenhum"], ["pb", "P/B"], ["colorido", "Colorido"]] as const).map(([v, l]) => (
                      <button
                        type="button"
                        key={v}
                        onClick={() => { setFlat(v); setFlatValor(null); }}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                          flat === v
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white text-neutral-700 border-neutral-300 hover:border-red-400"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={policromia} onCheckedChange={(c) => setPolicromia(!!c)} id="pol" />
                    <Label htmlFor="pol" className="font-normal text-sm cursor-pointer">
                      Policromia 4 cores
                    </Label>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={policromiaValor}
                    onChange={(e) => setPolicromiaValor(Number(e.target.value) || 0)}
                    className="w-20 text-xs h-8"
                    disabled={!policromia}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label>Descrição do orçamento (aparece no PDF)</Label>
                  {!descricaoAuto && (
                    <button
                      type="button"
                      onClick={() => setDescricaoAuto(true)}
                      className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restaurar padrão
                    </button>
                  )}
                </div>
                <Textarea
                  value={descricao}
                  onChange={(e) => { setDescricao(e.target.value); setDescricaoAuto(false); }}
                  rows={Math.min(descricao.split("\n").length + 1, 8)}
                  className="text-sm"
                  placeholder="Edite a descrição que vai aparecer no orçamento"
                />
              </div>

              {calculo && "erro" in calculo ? (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                  {calculo.erro}
                </div>
              ) : calculo ? (
                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 space-y-2">
                  <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">Resumo por faixa</p>
                  {calculo.porFaixa.map((fc, idx) => (
                    <div key={fc.faixa.id} className="rounded border border-emerald-200/60 bg-white/60 p-2">
                      <p className="text-xs font-semibold text-emerald-800 mb-1">
                        Faixa #{idx + 1} — {fc.qty}un {fc.faixa.acrescimo500 && <span className="text-amber-700">(+25%)</span>}
                      </p>
                      <ul className="text-[11px] text-neutral-700 space-y-0.5">
                        {fc.breakdown.map((l, i) => (<li key={i}>{l}</li>))}
                      </ul>
                      <div className="mt-1 pt-1 border-t border-emerald-100 flex justify-between text-xs">
                        <span className="text-neutral-600">Unit: {formatCurrency(fc.unit)}</span>
                        <span className="font-semibold">Subtotal: {formatCurrency(fc.total)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-1 border-t border-emerald-200 flex justify-between text-sm font-bold">
                    <span>Total geral:</span>
                    <span>{formatCurrency(calculo.total)}</span>
                  </div>
                </div>
              ) : null}

              {/* Pagamento — à vista e cartão INDEPENDENTES */}
              <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                <Label className="font-semibold">Pagamento</Label>

                {/* À vista */}
                <div className="space-y-2 p-2 rounded-md border bg-emerald-50/40">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">À vista</Label>
                    {(aVistaOverride != null || descontoAVistaPct > 0) && (
                      <button
                        type="button"
                        onClick={() => { setAVistaOverride(null); setDescontoAVistaPct(0); }}
                        className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" /> Resetar
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Desconto (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min={0}
                        max={100}
                        value={descontoAVistaPct}
                        onChange={(e) => { setDescontoAVistaPct(Number(e.target.value) || 0); setAVistaOverride(null); }}
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Valor final (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={aVistaValor.toFixed(2)}
                        onChange={(e) => setAVistaOverride(Number(e.target.value) || 0)}
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-emerald-700">À vista: <strong>{formatCurrency(aVistaValor)}</strong></p>
                </div>

                {/* Cartão — usa total calculado */}
                <div className="space-y-2 p-2 rounded-md border bg-blue-50/40">
                  <Label className="text-sm font-semibold">Cartão (sobre o total: {formatCurrency(cartaoValor)})</Label>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Parcelas</Label>
                      <Select value={String(parcelas)} onValueChange={(v) => setParcelas(Number(v))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map((n) => (
                            <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Tipo</Label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setComJuros(false)}
                          className={`flex-1 px-1 py-1.5 rounded text-xs font-medium border transition-colors ${
                            !comJuros
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-neutral-700 border-neutral-300 hover:border-red-400"
                          }`}
                        >
                          Sem juros
                        </button>
                        <button
                          type="button"
                          onClick={() => setComJuros(true)}
                          className={`flex-1 px-1 py-1.5 rounded text-xs font-medium border transition-colors ${
                            comJuros
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-neutral-700 border-neutral-300 hover:border-red-400"
                          }`}
                        >
                          Com juros
                        </button>
                      </div>
                    </div>
                  </div>

                  {comJuros && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Taxa (% a.m.)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={taxaJuros}
                        onChange={(e) => setTaxaJuros(Number(e.target.value) || 0)}
                        className="text-xs h-8"
                      />
                    </div>
                  )}

                  <p className="text-xs text-blue-700">
                    {parcelas > 1 ? (
                      <>
                        {parcelas}x {comJuros ? "com juros" : "sem juros"}: <strong>{formatCurrency(valorParcela)}/parcela</strong>
                        {comJuros && <span className="text-blue-500"> · total: {formatCurrency(totalParceladoComJuros)}</span>}
                      </>
                    ) : (
                      <>Pagamento único: <strong>{formatCurrency(cartaoValor)}</strong></>
                    )}
                  </p>
                </div>
              </div>

            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
          {onAdicionar && (
            <Button
              variant="outline"
              onClick={handleAdicionar}
              disabled={!sacola || !calculo || (calculo && "erro" in calculo) || loading}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Adicionar à lista
            </Button>
          )}
          <Button
            onClick={handleGerar}
            disabled={!sacola || !calculo || (calculo && "erro" in calculo) || loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Gerando..." : "Gerar Proposta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
