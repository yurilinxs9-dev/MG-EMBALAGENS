-- MG Embalagens — campos extras para layout de orçamento de produtos
-- Adiciona quantidade em proposta_servicos (preço unit × qty = subtotal)
-- Adiciona endereço e CPF/CNPJ em propostas

ALTER TABLE public.proposta_servicos
  ADD COLUMN IF NOT EXISTS quantidade INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.propostas
  ADD COLUMN IF NOT EXISTS cliente_endereco TEXT,
  ADD COLUMN IF NOT EXISTS cliente_cpf_cnpj TEXT;

-- observacoes (já existente em propostas) é reaproveitado como "Nota" do PDF
