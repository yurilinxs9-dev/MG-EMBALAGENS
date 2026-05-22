import { Button } from "@/components/ui/button";
import { generatePDF } from "@/lib/generatePDF";
import { useState } from "react";

const SAMPLE_ITENS = [
  {
    nome: "Sacola de Papel Premium",
    descricao: "Tamanho 25x10x28 cm\nPapel: AP 180 gramas\nAlça Nylon - Cor Preta\nLaminação Fosca dupla face\nVerniz Localizado UV\nImpressão 4x0 cores",
    valorUnitario: 2.50,
    quantidade: 1000,
  },
  {
    nome: "Sacola Boca Vazada Plástica",
    descricao: "Tamanho 30x40 cm - Cor Azul Royal\nPersonalização de 1 lado\nImpressão uma cor - Preta\nGramatura: 008 mícron\nMaterial: Polietileno baixa densidade",
    valorUnitario: 0.95,
    quantidade: 500,
  },
];

const valorTotal = SAMPLE_ITENS.reduce((s, i) => s + i.valorUnitario * i.quantidade, 0);

const SAMPLE = {
  clienteNome: "João Silva",
  clienteEmpresa: "PADARIA DO JOÃO LTDA",
  clienteEmail: "joao@padaria.com.br",
  clienteWhatsapp: "(37) 99999-1234",
  clienteEndereco: "Rua das Flores 123 - Centro",
  clienteCpfCnpj: "12.345.678/0001-90",
  nota: "Orçamento para itens personalizados.",
  itens: SAMPLE_ITENS,
  valorTotal,
};

export default function TestPDF() {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await generatePDF(SAMPLE);
    } catch (e: any) {
      alert("Erro: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6 bg-white rounded-2xl shadow p-8">
        <div>
          <h1 className="text-2xl font-bold">Teste de PDF — MG Embalagens</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Gera um PDF de exemplo com dados fixos para verificar layout, coordenadas e cores.
            Não precisa de autenticação nem Supabase.
          </p>
        </div>

        <div className="bg-neutral-50 rounded-lg p-4 text-sm space-y-1">
          <p><strong>Cliente:</strong> {SAMPLE.clienteEmpresa}</p>
          <p><strong>CPF/CNPJ:</strong> {SAMPLE.clienteCpfCnpj}</p>
          <p><strong>Itens:</strong> {SAMPLE.itens.length}</p>
          <p><strong>Total:</strong> R$ {SAMPLE.valorTotal.toFixed(2).replace(".", ",")}</p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 h-12 text-base"
        >
          {loading ? "Gerando..." : "Gerar PDF de Teste"}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Compare o PDF gerado com <code>public/Orcamento_MODELO_MG.pdf</code> — só os dados dinâmicos devem mudar.
        </p>
      </div>
    </div>
  );
}
