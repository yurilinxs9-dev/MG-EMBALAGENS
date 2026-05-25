import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateProposta, useUpdatePropostaCompleta, useProposta } from "@/hooks/usePropostas";
import {
  useServicosPersonalizados,
  useCreateServico,
  useDeleteServico,
  useToggleOculto,
} from "@/hooks/useServicosPersonalizados";
import { SERVICOS_PADRAO, type Servico } from "@/types/proposta";
import { useToast } from "@/hooks/use-toast";
import { generatePDF } from "@/lib/generatePDF";
import { ArrowLeft, FileDown, Save, Plus, Settings, Trash2, Eye, EyeOff, Calendar, Calculator } from "lucide-react";
import CalculadoraPapelMaquina, { type ItemCalculado, type PagamentoInfo } from "@/components/CalculadoraPapelMaquina";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

interface ItemComId extends Servico {
  id?: string;
  isCustom?: boolean;
  oculto?: boolean;
  quantidade?: number;
}

export default function NovaProposta() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const createProposta = useCreateProposta();
  const updatePropostaCompleta = useUpdatePropostaCompleta();
  const { toast } = useToast();

  const leadCliente = searchParams.get("cliente") || "";
  const leadEmpresa = searchParams.get("empresa") || "";
  const leadWhatsapp = searchParams.get("whatsapp") || "";
  const leadPropostaId = searchParams.get("propostaId") || "";
  const isEditingLead = !!leadPropostaId;

  const { data: propostaExistente } = useProposta(leadPropostaId || undefined);
  const isEditingExisting = isEditingLead && (propostaExistente?.proposta_servicos?.length ?? 0) > 0;
  const preenchidoRef = useRef(false);

  const { data: servicosPersonalizados = [], isLoading: loadingServicos } = useServicosPersonalizados();
  const createServico = useCreateServico();
  const deleteServico = useDeleteServico();
  const toggleOculto = useToggleOculto();

  const [clienteNome, setClienteNome] = useState(leadCliente);
  const [clienteEmpresa, setClienteEmpresa] = useState(leadEmpresa);
  const [clienteWhatsapp, setClienteWhatsapp] = useState(leadWhatsapp);
  const [clienteEmail, setClienteEmail] = useState("");
  const [clienteEndereco, setClienteEndereco] = useState("");
  const [nota, setNota] = useState("Orçamento para itens personalizados.");
  const [itens, setItens] = useState<ItemComId[]>([]);
  const [step, setStep] = useState<"form" | "resumo">("form");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showCalcPapel, setShowCalcPapel] = useState(false);

  const [gerandoPapel, setGerandoPapel] = useState(false);

  // Pagamento — cartão usa valor total; à vista permite desconto/override
  const [aVistaOverride, setAVistaOverride] = useState<number | null>(null);
  const [descontoAVistaPct, setDescontoAVistaPct] = useState<number>(0);
  const [parcelas, setParcelas] = useState<number>(6);
  const [comJuros, setComJuros] = useState<boolean>(false);
  const [taxaJuros, setTaxaJuros] = useState<number>(2.5);

  interface ClienteDados {
    nome: string;
    empresa: string;
    whatsapp: string;
    email: string;
    endereco: string;
  }

  const [pendingPapelCalc, setPendingPapelCalc] = useState<ItemCalculado[] | null>(null);
  const [pendingPapelPagamento, setPendingPapelPagamento] = useState<PagamentoInfo | null>(null);
  const [popupNome, setPopupNome] = useState("");
  const [popupEmpresa, setPopupEmpresa] = useState("");
  const [popupWhatsapp, setPopupWhatsapp] = useState("");
  const [popupEmail, setPopupEmail] = useState("");
  const [popupEndereco, setPopupEndereco] = useState("");

  const gerarPropostaPapelComCliente = async (calcs: ItemCalculado[], pagamento: PagamentoInfo, cliente: ClienteDados) => {
    setGerandoPapel(true);
    try {
      const valorTotalProposta = Number(
        calcs.reduce((s, c) => s + c.valorUnitario * c.quantidade, 0).toFixed(2),
      );

      const valoresProposta: any = {
        cliente_nome: cliente.nome,
        cliente_empresa: cliente.empresa || undefined,
        cliente_whatsapp: cliente.whatsapp || undefined,
        cliente_email: cliente.email || undefined,
        cliente_endereco: cliente.endereco || undefined,
        valor_mensal: 0,
        valor_setup: 0,
        valor_total: valorTotalProposta,
        desconto_tipo: "fixo",
        desconto_valor: 0,
        observacoes: nota || undefined,
        servicos: calcs.map((c) => ({
          servico_nome: c.nome,
          descricao: c.descricao,
          valor_mensal: c.valorUnitario,
          valor_setup: 0,
          quantidade: c.quantidade,
        })),
      };

      if (isEditingLead) {
        await updatePropostaCompleta.mutateAsync({ id: leadPropostaId, ...valoresProposta });
      } else {
        await createProposta.mutateAsync({ ...valoresProposta, criado_por: user?.id });
      }

      try {
        await generatePDF({
          clienteNome: cliente.nome,
          clienteEmpresa: cliente.empresa,
          clienteEmail: cliente.email,
          clienteWhatsapp: cliente.whatsapp,
          clienteEndereco: cliente.endereco,
          nota: nota || "",
          itens: calcs.map((c) => ({
            nome: c.nome,
            descricao: c.descricao,
            valorUnitario: c.valorUnitario,
            quantidade: c.quantidade,
          })),
          valorTotal: valorTotalProposta,
          pagamento,
        });
      } catch (pdfError: any) {
        toast({ title: "Proposta salva, erro no PDF", description: pdfError.message, variant: "destructive" });
      }

      toast({ title: "Proposta gerada!" });
      setShowCalcPapel(false);
      navigate("/propostas");
    } catch (error: any) {
      toast({ title: "Erro ao gerar proposta", description: error.message, variant: "destructive" });
    } finally {
      setGerandoPapel(false);
    }
  };

  const handleGerarPropostaPapel = async (calcs: ItemCalculado[], pagamento: PagamentoInfo) => {
    if (!clienteNome.trim()) {
      setPopupNome(clienteNome);
      setPopupEmpresa(clienteEmpresa);
      setPopupWhatsapp(clienteWhatsapp);
      setPopupEmail(clienteEmail);
      setPopupEndereco(clienteEndereco);
      setPendingPapelCalc(calcs);
      setPendingPapelPagamento(pagamento);
      return;
    }
    await gerarPropostaPapelComCliente(calcs, pagamento, {
      nome: clienteNome,
      empresa: clienteEmpresa,
      whatsapp: clienteWhatsapp,
      email: clienteEmail,
      endereco: clienteEndereco,
    });
  };

  const handlePopupConfirmar = async () => {
    if (!popupNome.trim() || !pendingPapelCalc || !pendingPapelPagamento) return;
    setClienteNome(popupNome);
    setClienteEmpresa(popupEmpresa);
    setClienteWhatsapp(popupWhatsapp);
    setClienteEmail(popupEmail);
    setClienteEndereco(popupEndereco);
    const calcs = pendingPapelCalc;
    const pagamento = pendingPapelPagamento;
    setPendingPapelCalc(null);
    setPendingPapelPagamento(null);
    await gerarPropostaPapelComCliente(calcs, pagamento, {
      nome: popupNome,
      empresa: popupEmpresa,
      whatsapp: popupWhatsapp,
      email: popupEmail,
      endereco: popupEndereco,
    });
  };

  const [novoNome, setNovoNome] = useState("");
  const [novoDescricao, setNovoDescricao] = useState("");
  const [novoValorUnit, setNovoValorUnit] = useState(0);

  useEffect(() => {
    const padrao: ItemComId[] = SERVICOS_PADRAO.map((s) => ({
      ...s,
      isCustom: false,
      quantidade: 1,
    }));

    const custom: ItemComId[] = servicosPersonalizados.map((sp) => ({
      id: sp.id,
      nome: sp.nome,
      descricao: sp.descricao || "",
      valor_mensal: Number(sp.valor_mensal) || 0,
      valor_setup: 0,
      temSetup: false,
      selecionado: false,
      isCustom: true,
      oculto: sp.oculto,
      quantidade: 1,
    }));

    setItens((prev) => {
      const combined = [...padrao, ...custom];
      return combined.map((s) => {
        const existing = prev.find((p) => p.nome === s.nome);
        if (existing) {
          return {
            ...s,
            selecionado: existing.selecionado,
            descricao: existing.descricao,
            valor_mensal: existing.selecionado ? existing.valor_mensal : s.valor_mensal,
            quantidade: existing.selecionado ? existing.quantidade : s.quantidade,
          };
        }
        return s;
      });
    });
  }, [servicosPersonalizados]);

  useEffect(() => {
    if (!propostaExistente || itens.length === 0 || preenchidoRef.current) return;
    preenchidoRef.current = true;

    setClienteNome(propostaExistente.cliente_nome ?? "");
    setClienteEmpresa(propostaExistente.cliente_empresa ?? "");
    setClienteWhatsapp(propostaExistente.cliente_whatsapp ?? "");
    setClienteEmail(propostaExistente.cliente_email ?? "");
    setClienteEndereco((propostaExistente as any).cliente_endereco ?? "");
    setNota(propostaExistente.observacoes ?? "");

    const itensSalvos = propostaExistente.proposta_servicos ?? [];
    if (itensSalvos.length > 0) {
      setItens((prev) =>
        prev.map((s) => {
          const saved = itensSalvos.find((sv) => sv.servico_nome === s.nome);
          if (!saved) return s;
          return {
            ...s,
            selecionado: true,
            valor_mensal: Number(saved.valor_mensal) || 0,
            quantidade: Number((saved as any).quantidade) || 1,
            descricao: saved.descricao ?? s.descricao,
          };
        })
      );
    }
  }, [propostaExistente, itens.length]);

  const toggleItem = (index: number) => {
    setItens((prev) =>
      prev.map((s, i) => (i === index ? { ...s, selecionado: !s.selecionado } : s))
    );
  };

  const updateValorUnit = (index: number, value: number) => {
    setItens((prev) => prev.map((s, i) => (i === index ? { ...s, valor_mensal: value } : s)));
  };

  const updateQuantidade = (index: number, value: number) => {
    setItens((prev) => prev.map((s, i) => (i === index ? { ...s, quantidade: Math.max(1, value) } : s)));
  };

  const updateDescricao = (index: number, value: string) => {
    setItens((prev) => prev.map((s, i) => (i === index ? { ...s, descricao: value } : s)));
  };

  const PRESETS_COR = ["Preto", "Cinza", "Branco"] as const;
  type PresetCor = (typeof PRESETS_COR)[number];

  const parseCorLine = (descricao: string) => {
    const lines = (descricao || "").split("\n");
    const lineIdx = lines.findIndex((l) => /^[-\s]*Cor:/i.test(l));
    const presets = new Set<PresetCor>();
    let custom = "";
    if (lineIdx >= 0) {
      const valor = lines[lineIdx].replace(/^[-\s]*Cor:\s*/i, "").trim();
      const parts = valor.split(",").map((p) => p.trim()).filter(Boolean);
      const extras: string[] = [];
      for (const p of parts) {
        const match = PRESETS_COR.find((pr) => pr.toLowerCase() === p.toLowerCase());
        if (match) presets.add(match);
        else extras.push(p);
      }
      custom = extras.join(", ");
    }
    return { presets, custom, lineIdx, lines };
  };

  const rebuildDescricaoComCor = (descricao: string, presets: Set<PresetCor>, custom: string) => {
    const { lineIdx, lines } = parseCorLine(descricao);
    const partes = [...presets, custom.trim()].filter(Boolean) as string[];
    if (partes.length === 0) {
      if (lineIdx >= 0) lines.splice(lineIdx, 1);
    } else {
      const novaLinha = `- Cor: ${partes.join(", ")}`;
      if (lineIdx >= 0) lines[lineIdx] = novaLinha;
      else lines.push(novaLinha);
    }
    return lines.filter((l) => l.trim().length > 0).join("\n");
  };

  const togglePresetCor = (index: number, preset: PresetCor) => {
    setItens((prev) => prev.map((s, i) => {
      if (i !== index) return s;
      const { presets, custom } = parseCorLine(s.descricao);
      if (presets.has(preset)) presets.delete(preset);
      else presets.add(preset);
      return { ...s, descricao: rebuildDescricaoComCor(s.descricao, presets, custom) };
    }));
  };

  const setCorCustom = (index: number, custom: string) => {
    setItens((prev) => prev.map((s, i) => {
      if (i !== index) return s;
      const { presets } = parseCorLine(s.descricao);
      return { ...s, descricao: rebuildDescricaoComCor(s.descricao, presets, custom) };
    }));
  };

  const itensVisiveis = itens.filter((s) => !s.oculto);
  const selecionados = itens.filter((s) => s.selecionado);

  const valorTotal = selecionados.reduce(
    (sum, s) => sum + (Number(s.valor_mensal) || 0) * (Number(s.quantidade) || 1),
    0,
  );

  const aVistaValor = aVistaOverride ?? (valorTotal * (1 - (descontoAVistaPct || 0) / 100));
  const cartaoValor = valorTotal;

  const valorParcela = useMemo(() => {
    if (parcelas <= 1) return cartaoValor;
    if (!comJuros || taxaJuros <= 0) return cartaoValor / parcelas;
    const i = taxaJuros / 100;
    return (cartaoValor * (i * Math.pow(1 + i, parcelas))) / (Math.pow(1 + i, parcelas) - 1);
  }, [cartaoValor, parcelas, comJuros, taxaJuros]);

  const totalParceladoComJuros = valorParcela * parcelas;

  const pagamentoPayload = () => ({
    aVista: Number(aVistaValor.toFixed(2)),
    parcelas,
    valorParcela: Number(valorParcela.toFixed(2)),
    comJuros,
    taxaJuros: comJuros ? taxaJuros : undefined,
  });

  const canSubmit = clienteNome.trim() && selecionados.length > 0;

  const handleAddItem = async () => {
    if (!novoNome.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    try {
      await createServico.mutateAsync({
        nome: novoNome,
        descricao: novoDescricao,
        valor_mensal: novoValorUnit,
        valor_setup: 0,
        tem_setup: false,
      });
      toast({ title: "Item adicionado!" });
      setShowAddModal(false);
      setNovoNome("");
      setNovoDescricao("");
      setNovoValorUnit(0);
    } catch (error: any) {
      toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteServico.mutateAsync(id);
      toast({ title: "Item removido!" });
    } catch (error: any) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleOculto = async (id: string, oculto: boolean) => {
    try {
      await toggleOculto.mutateAsync({ id, oculto });
    } catch (error: any) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    }
  };

  const handleSave = async (downloadPDF = false) => {
    try {
      const itensFormatados = selecionados.map((s) => ({
        servico_nome: s.nome,
        descricao: s.descricao || "",
        valor_mensal: Number(s.valor_mensal) || 0,
        valor_setup: 0,
        quantidade: Number(s.quantidade) || 1,
      }));

      const valoresProposta: any = {
        cliente_nome: clienteNome,
        cliente_empresa: clienteEmpresa || undefined,
        cliente_whatsapp: clienteWhatsapp || undefined,
        cliente_email: clienteEmail || undefined,
        cliente_endereco: clienteEndereco || undefined,
        valor_mensal: 0,
        valor_setup: 0,
        valor_total: Number(valorTotal) || 0,
        desconto_tipo: "fixo",
        desconto_valor: 0,
        observacoes: nota || undefined,
        servicos: itensFormatados,
      };

      if (isEditingLead) {
        await updatePropostaCompleta.mutateAsync({ id: leadPropostaId, ...valoresProposta });
      } else {
        await createProposta.mutateAsync({ ...valoresProposta, criado_por: user?.id });
      }

      toast({
        title: isEditingExisting
          ? "Orçamento editado com sucesso!"
          : isEditingLead
          ? "Orçamento atualizado com sucesso!"
          : "Orçamento salvo com sucesso!",
      });

      if (downloadPDF) {
        try {
          await generatePDF({
            clienteNome,
            clienteEmpresa,
            clienteEmail,
            clienteWhatsapp,
            clienteEndereco,
            nota,
            itens: selecionados.map((s) => ({
              nome: s.nome,
              descricao: s.descricao || "",
              valorUnitario: Number(s.valor_mensal) || 0,
              quantidade: Number(s.quantidade) || 1,
            })),
            valorTotal,
            pagamento: pagamentoPayload(),
          });
        } catch (pdfError: any) {
          toast({ title: "Erro ao gerar PDF", description: pdfError.message, variant: "destructive" });
        }
      }

      navigate("/propostas");
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
  };

  const isSaving = createProposta.isPending || updatePropostaCompleta.isPending;

  if (step === "resumo") {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setStep("form")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Resumo do Orçamento</h1>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Dados do Cliente</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Nome:</strong> {clienteNome}</p>
            {clienteEmpresa && <p><strong>Empresa:</strong> {clienteEmpresa}</p>}
            {clienteEndereco && <p><strong>Endereço:</strong> {clienteEndereco}</p>}
            {clienteWhatsapp && <p><strong>Telefone:</strong> {clienteWhatsapp}</p>}
            {clienteEmail && <p><strong>E-mail:</strong> {clienteEmail}</p>}
            <p><strong>Data:</strong> {new Date().toLocaleDateString("pt-BR")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Itens Selecionados</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selecionados.map((s, idx) => {
                const qty = s.quantidade ?? 1;
                const subtotal = (s.valor_mensal || 0) * qty;
                return (
                  <div key={s.nome} className="flex justify-between items-start text-sm border-b pb-3">
                    <div className="flex-1 mr-4">
                      <p className="font-medium">{String(idx + 1).padStart(2, "0")}. {s.nome}</p>
                      <ul className="mt-1 space-y-0.5">
                        {s.descricao.split("\n").filter(l => l.trim()).map((item, i) => (
                          <li key={i} className="text-muted-foreground text-xs">- {item.trim()}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-red-600">{formatCurrency(subtotal)}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(s.valor_mensal || 0)} × {qty}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between font-bold text-lg">
              <span>TOTAL:</span>
              <span className="text-red-600">{formatCurrency(valorTotal)}</span>
            </div>
          </CardContent>
        </Card>

        {nota && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Nota</CardTitle></CardHeader>
            <CardContent><p className="text-sm">{nota}</p></CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button className="flex-1" onClick={() => handleSave(false)} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isEditingExisting ? "Salvar Edição" : isEditingLead ? "Atualizar Orçamento" : "Salvar Orçamento"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => handleSave(true)} disabled={isSaving}>
            <FileDown className="h-4 w-4 mr-2" />
            {isEditingExisting ? "Salvar e Baixar PDF" : isEditingLead ? "Atualizar e Baixar PDF" : "Salvar e Baixar PDF"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight">
            {isEditingExisting ? "Editar Orçamento" : isEditingLead ? "Completar Orçamento" : "Novo Orçamento"}
          </h1>
          {isEditingExisting && (
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 gap-1">Editando</Badge>
          )}
          {isEditingLead && !isEditingExisting && (
            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 gap-1">
              <Calendar className="h-3 w-3" />
              Lead da Agenda
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-1">
          {isEditingExisting
            ? `Editando orçamento de ${propostaExistente?.cliente_nome}`
            : isEditingLead
            ? `Complete o orçamento para ${leadCliente}`
            : "Preencha os dados e selecione os itens"}
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Dados do Cliente</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome do cliente *</Label>
              <Input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input value={clienteEmpresa} onChange={(e) => setClienteEmpresa(e.target.value)} placeholder="Razão social / nome fantasia" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Endereço</Label>
              <Input value={clienteEndereco} onChange={(e) => setClienteEndereco(e.target.value)} placeholder="Rua, número, bairro" />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={clienteWhatsapp} onChange={(e) => setClienteWhatsapp(e.target.value)} placeholder="(37) 99999-9999" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>E-mail</Label>
              <Input type="email" value={clienteEmail} onChange={(e) => setClienteEmail(e.target.value)} placeholder="cliente@email.com" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Nota do Orçamento</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Nota que aparecerá no PDF"
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Pagamento — à vista e cartão são INDEPENDENTES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* À vista */}
          <div className="space-y-2 p-3 rounded-lg border bg-emerald-50/40">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-sm">À vista</Label>
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
                  placeholder="0"
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
                />
              </div>
            </div>
            <p className="text-xs text-emerald-700">À vista: <strong>{formatCurrency(aVistaValor)}</strong></p>
          </div>

          {/* Cartão — usa o total da proposta */}
          <div className="space-y-2 p-3 rounded-lg border bg-blue-50/40">
            <Label className="font-semibold text-sm">Cartão (sobre o total: {formatCurrency(valorTotal)})</Label>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Parcelas</Label>
                <Select value={String(parcelas)} onValueChange={(v) => setParcelas(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setComJuros(false)}
                    className={`flex-1 px-2 py-2 rounded text-xs font-medium border transition-colors ${
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
                    className={`flex-1 px-2 py-2 rounded text-xs font-medium border transition-colors ${
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
                <Label className="text-xs text-muted-foreground">Taxa de juros (% ao mês)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={taxaJuros}
                  onChange={(e) => setTaxaJuros(Number(e.target.value) || 0)}
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

          <Button
            className="w-full bg-red-600 hover:bg-red-700"
            size="lg"
            disabled={!canSubmit || isSaving}
            onClick={() => handleSave(true)}
          >
            <FileDown className="h-4 w-4 mr-2" />
            {isSaving ? "Gerando..." : "Gerar Proposta agora"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Itens</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowConfigModal(true)} className="gap-1">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Gerenciar</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowCalcPapel(true)} className="gap-1 border-red-300 text-red-700 hover:bg-red-50">
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">Sacola Papel</span>
              </Button>
              <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-1">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Item</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingServicos ? (
            <p className="text-sm text-muted-foreground">Carregando itens...</p>
          ) : (
            itensVisiveis.map((item) => {
              const realIndex = itens.findIndex((s) => s.nome === item.nome);
              const qty = item.quantidade ?? 1;
              const subtotal = (item.valor_mensal || 0) * qty;
              return (
                <div key={item.nome} className={`p-4 rounded-lg border transition-colors ${item.selecionado ? "border-primary bg-primary/5" : ""}`}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={item.selecionado}
                      onCheckedChange={() => toggleItem(realIndex)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.nome}</p>
                        {item.isCustom && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Personalizado
                          </span>
                        )}
                      </div>
                      {!item.selecionado && (
                        <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
                          {item.descricao.split("\n").filter(l => l.trim()).slice(0, 3).map((sub, i) => (
                            <li key={i} className="text-xs">- {sub.trim()}</li>
                          ))}
                          {item.descricao.split("\n").filter(l => l.trim()).length > 3 && (
                            <li className="text-xs text-muted-foreground/60">
                              +{item.descricao.split("\n").filter(l => l.trim()).length - 3} itens...
                            </li>
                          )}
                        </ul>
                      )}
                      {item.selecionado && (
                        <div className="space-y-3 mt-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Cor (selecione uma ou mais)</Label>
                            <div className="flex flex-wrap gap-2">
                              {PRESETS_COR.map((cor) => {
                                const { presets } = parseCorLine(item.descricao);
                                const ativo = presets.has(cor);
                                return (
                                  <button
                                    type="button"
                                    key={cor}
                                    onClick={() => togglePresetCor(realIndex, cor)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                                      ativo
                                        ? "bg-red-600 text-white border-red-600"
                                        : "bg-white text-neutral-700 border-neutral-300 hover:border-red-400"
                                    }`}
                                  >
                                    {cor}
                                  </button>
                                );
                              })}
                            </div>
                            <Input
                              value={parseCorLine(item.descricao).custom}
                              onChange={(e) => setCorCustom(realIndex, e.target.value)}
                              placeholder="Outras cores (ex: Vermelho, Dourado)"
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Especificações (uma por linha — aparecem no PDF)</Label>
                            <Textarea
                              value={item.descricao}
                              onChange={(e) => updateDescricao(realIndex, e.target.value)}
                              rows={Math.min(item.descricao.split("\n").length + 1, 12)}
                              className="text-sm"
                              placeholder="Tamanho 25x10x28&#10;Papel: AP 180 gramas&#10;Alça Nylon - Cor Preta"
                            />
                          </div>
                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Valor unitário (R$)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.valor_mensal}
                                onChange={(e) => updateValorUnit(realIndex, Number(e.target.value))}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Quantidade</Label>
                              <Input
                                type="number"
                                min={1}
                                value={qty}
                                onChange={(e) => updateQuantidade(realIndex, Number(e.target.value))}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Subtotal</Label>
                              <div className="h-10 flex items-center px-3 rounded-md bg-muted font-bold text-red-600 text-sm">
                                {formatCurrency(subtotal)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <div className="p-4 rounded-lg bg-card border">
        <div className="flex justify-between font-bold text-lg">
          <span>TOTAL:</span>
          <span className="text-red-600">{formatCurrency(valorTotal)}</span>
        </div>
      </div>

      <Button variant="outline" className="w-full" size="lg" disabled={!canSubmit} onClick={() => setStep("resumo")}>
        Ver Resumo do Orçamento
      </Button>

      {/* Modal: Adicionar Novo Item */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Item Personalizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do item *</Label>
              <Input
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Ex: Sacola Kraft 30x40"
              />
            </div>
            <div className="space-y-2">
              <Label>Especificações (uma por linha)</Label>
              <Textarea
                value={novoDescricao}
                onChange={(e) => setNovoDescricao(e.target.value)}
                rows={4}
                placeholder="Tamanho 30x40&#10;Gramatura 180g&#10;Alça Nylon"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor unitário padrão (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={novoValorUnit}
                onChange={(e) => setNovoValorUnit(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancelar</Button>
            <Button onClick={handleAddItem} disabled={createServico.isPending}>
              {createServico.isPending ? "Salvando..." : "Salvar Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Gerenciar Itens */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerenciar Itens</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-muted-foreground mb-4">
              Oculte ou apague itens personalizados. Itens ocultos não aparecem na lista mas podem ser reativados.
            </p>
            {servicosPersonalizados.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Você ainda não criou itens personalizados.
              </p>
            ) : (
              servicosPersonalizados.map((sp) => (
                <div
                  key={sp.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${sp.oculto ? "bg-muted/50 opacity-60" : ""}`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{sp.nome}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(sp.valor_mensal)} unit.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => handleToggleOculto(sp.id, !sp.oculto)}
                      title={sp.oculto ? "Mostrar" : "Ocultar"}
                    >
                      {sp.oculto ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteItem(sp.id)}
                      title="Apagar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowConfigModal(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CalculadoraPapelMaquina
        open={showCalcPapel}
        onClose={() => setShowCalcPapel(false)}
        onGerar={handleGerarPropostaPapel}
        loading={gerandoPapel}
      />

      <Dialog open={!!pendingPapelCalc} onOpenChange={(o) => !o && setPendingPapelCalc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Faltam dados do cliente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Preencha o nome do cliente para gerar a proposta. Seu orçamento está salvo.
          </p>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome do cliente *</Label>
              <Input value={popupNome} onChange={(e) => setPopupNome(e.target.value)} placeholder="Nome completo" autoFocus />
            </div>
            <div className="space-y-1">
              <Label>Empresa</Label>
              <Input value={popupEmpresa} onChange={(e) => setPopupEmpresa(e.target.value)} placeholder="Razão social / nome fantasia" />
            </div>
            <div className="space-y-1">
              <Label>Endereço</Label>
              <Input value={popupEndereco} onChange={(e) => setPopupEndereco(e.target.value)} placeholder="Rua, número, bairro" />
            </div>
            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input value={popupWhatsapp} onChange={(e) => setPopupWhatsapp(e.target.value)} placeholder="(37) 99999-9999" />
            </div>
            <div className="space-y-1">
              <Label>E-mail</Label>
              <Input type="email" value={popupEmail} onChange={(e) => setPopupEmail(e.target.value)} placeholder="cliente@email.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingPapelCalc(null)} disabled={gerandoPapel}>
              Cancelar
            </Button>
            <Button
              onClick={handlePopupConfirmar}
              disabled={!popupNome.trim() || gerandoPapel}
              className="bg-red-600 hover:bg-red-700"
            >
              {gerandoPapel ? "Gerando..." : "Gerar proposta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
