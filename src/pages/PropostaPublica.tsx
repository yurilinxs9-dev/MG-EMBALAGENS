import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGetPropostaByToken, useAceitarProposta } from "@/hooks/usePropostas";
import { registrarVisualizacao, registrarAceite } from "@/hooks/useAtividades";
import { generatePDF } from "@/lib/generatePDF";
import { STATUS_LABELS, STATUS_COLORS } from "@/types/proposta";
import { FileDown, CheckCircle, FileX } from "lucide-react";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function PropostaPublica() {
  const { token } = useParams<{ token: string }>();
  const { data: proposta, isLoading } = useGetPropostaByToken(token);
  const aceitarProposta = useAceitarProposta();
  const [showAceitarDialog, setShowAceitarDialog] = useState(false);
  const [aceita, setAceita] = useState(false);
  const viewRegistered = useRef(false);

  // Registrar visualização uma única vez
  useEffect(() => {
    if (proposta && token && !viewRegistered.current) {
      viewRegistered.current = true;
      registrarVisualizacao(token, proposta.id);
    }
  }, [proposta, token]);

  const handleAceitar = async () => {
    if (!token || !proposta) return;
    await aceitarProposta.mutateAsync(token);
    await registrarAceite(proposta.id);
    setAceita(true);
  };

  const handleDownloadPDF = async () => {
    if (!proposta || !proposta.proposta_servicos) return;
    const itens = proposta.proposta_servicos.map((s: any) => ({
      nome: s.servico_nome,
      descricao: s.descricao || "",
      valorUnitario: s.valor_mensal,
      quantidade: s.quantidade ?? 1,
    }));

    await generatePDF({
      clienteNome: proposta.cliente_nome,
      clienteEmpresa: proposta.cliente_empresa || "",
      clienteEmail: proposta.cliente_email || "",
      clienteWhatsapp: proposta.cliente_whatsapp || "",
      clienteEndereco: (proposta as any).cliente_endereco || "",
      nota: proposta.observacoes || "",
      itens,
      valorTotal: proposta.valor_total,
      propostaNumero: undefined,
    });
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-60 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (!proposta) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <FileX className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-800">Proposta não encontrada</h1>
          <p className="text-neutral-500">O link pode estar incorreto ou a proposta foi removida.</p>
        </div>
      </div>
    );
  }

  const isJaAceita = proposta.status === "fechado" || aceita;

  // ── Já aceita ────────────────────────────────────────────────────────────────
  if (aceita) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="text-center space-y-5 max-w-sm">
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-5xl">
            🎉
          </div>
          <h1 className="text-2xl font-bold text-neutral-800">Proposta aceita!</h1>
          <p className="text-neutral-500 leading-relaxed">
            Obrigado, <strong>{proposta.cliente_nome}</strong>! Sua confirmação foi registrada.
            Em breve entraremos em contato para dar início ao trabalho.
          </p>
          <div className="pt-2 text-sm text-neutral-400">
            MG Embalagens — Embalagens Personalizadas
          </div>
        </div>
      </div>
    );
  }

  const servicos = proposta.proposta_servicos || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* ── Header ── */}
      <div className="bg-[#0a0a0a] text-white">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-mg.png" alt="MG" className="w-10 h-10 object-contain" />
            <div>
              <p className="font-black text-sm tracking-tight">MG Embalagens</p>
              <p className="text-xs text-red-500/70 font-medium tracking-wider uppercase">
                Embalagens Personalizadas
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40 uppercase tracking-wider">Orçamento</p>
            <p className="text-xs text-white/60 mt-0.5">
              {new Date(proposta.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* ── Status banner ── */}
        <div className="flex flex-wrap items-center gap-3">
          <Badge className={STATUS_COLORS[proposta.status]}>
            {STATUS_LABELS[proposta.status]}
          </Badge>

          {isJaAceita && (
            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="h-3 w-3" />
              Proposta aceita
            </div>
          )}
        </div>

        {/* ── Cliente ── */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-600 to-red-500" />
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Orçamento para
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-red-600">
              {(proposta.cliente_empresa || proposta.cliente_nome)?.toUpperCase()}
            </h1>
            {proposta.cliente_empresa && (
              <p className="text-sm text-muted-foreground mt-0.5">{proposta.cliente_nome}</p>
            )}
            {(proposta as any).cliente_endereco && (
              <p className="text-sm text-muted-foreground mt-2"><span className="font-semibold">Endereço:</span> {(proposta as any).cliente_endereco}</p>
            )}
            {proposta.cliente_whatsapp && (
              <p className="text-sm text-muted-foreground"><span className="font-semibold">Telefone:</span> {proposta.cliente_whatsapp}</p>
            )}
            {proposta.cliente_email && (
              <p className="text-sm text-muted-foreground"><span className="font-semibold">E-mail:</span> {proposta.cliente_email}</p>
            )}
            {proposta.observacoes && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Nota</p>
                <p className="text-sm">{proposta.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Itens ── */}
        {servicos.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Itens do orçamento
            </h2>
            {servicos.map((s: any, idx: number) => {
              const qty = s.quantidade ?? 1;
              const subtotal = s.valor_mensal * qty;
              return (
                <Card key={s.id} className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-baseline gap-3">
                        <span className="text-xs font-bold text-muted-foreground tabular-nums">
                          {String(idx + 1).padStart(2, "0")}.
                        </span>
                        <h3 className="font-bold text-[#1F1F1F] leading-tight">{s.servico_nome}</h3>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm text-red-600">{formatCurrency(subtotal)}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(s.valor_mensal)} × {qty}</p>
                      </div>
                    </div>
                    {s.descricao && (
                      <ul className="space-y-1 ml-7">
                        {s.descricao.split("\n").filter(Boolean).map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-red-500 mt-0.5 shrink-0">•</span>
                            <span>{item.replace(/^-\s*/, "")}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              Detalhes dos itens serão enviados em breve.
            </CardContent>
          </Card>
        )}

        {/* ── Total ── */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-600 to-red-500" />
          <CardContent className="p-5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-base">TOTAL</span>
              <span className="text-2xl font-extrabold text-red-600">
                {formatCurrency(proposta.valor_total)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ── Ações ── */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          {!isJaAceita && (
            <Button
              className="flex-1 h-12 text-base font-bold bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg shadow-red-500/20"
              onClick={() => setShowAceitarDialog(true)}
              disabled={aceitarProposta.isPending}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Aprovar Orçamento
            </Button>
          )}

          {servicos.length > 0 && (
            <Button
              variant="outline"
              className="flex-1 h-12 text-base font-medium"
              onClick={handleDownloadPDF}
            >
              <FileDown className="h-5 w-5 mr-2" />
              Baixar PDF
            </Button>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-6">
          © {new Date().getFullYear()} MG Embalagens — Embalagens Personalizadas
        </p>
      </div>

      {/* ── Confirm aceitar dialog ── */}
      <AlertDialog open={showAceitarDialog} onOpenChange={setShowAceitarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar aprovação do orçamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao confirmar, você aprova os itens e valores descritos neste orçamento.
              Nossa equipe entrará em contato para dar início à produção.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleAceitar}
            >
              Sim, aprovo o orçamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
