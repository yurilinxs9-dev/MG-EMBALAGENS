# MG Embalagens — Sistema de Orçamentos

Fork do projeto `joni-proposta-main` adaptado para MG Embalagens Personalizadas.
Modelo de negócio: produtos físicos (qty × preço unit), não serviços recorrentes.

---

## Mudanças aplicadas

### Marca
- `index.html`: title, meta description/author/og → MG Embalagens
- `src/components/AppSidebar.tsx`: logo, "MG Propostas", "Embalagens Personalizadas"
- `src/pages/Auth.tsx`: marca + paleta amber→red
- `src/pages/PropostaPublica.tsx`: header, footer, CTA "Aprovar Orçamento"
- `public/logo-mg.png`: **placeholder** (cópia do JG) — substituir pelo PNG real

### Tema
- `src/index.css`: tokens HSL `primary`/`ring`/`info` → red (hue 0)
- `.gold-gradient`/`.gold-text` mantidos como alias (apontam pro vermelho)
- `.red-gradient`/`.red-text`: novos utilitários

### Schema (migration nova: `20260507000000_mg_embalagens_fields.sql`)
```sql
ALTER TABLE proposta_servicos ADD COLUMN quantidade INTEGER NOT NULL DEFAULT 1;
ALTER TABLE propostas
  ADD COLUMN cliente_endereco TEXT,
  ADD COLUMN cliente_cpf_cnpj TEXT;
```
- `observacoes` reaproveitado como "Nota" do PDF
- `valor_mensal` reinterpretado como **preço unitário**
- `valor_setup`, `desconto_*` ficam zerados/inativos no fluxo MG

### PDF (`src/lib/generatePDF.ts`)
- Template novo: `public/Orcamento_MODELO_MG.pdf`
- Coordenadas extraídas via pdfplumber (page 614×860)
- Whiteout de textos estáticos do template + redesenho dinâmico
- Colunas: NO / DESCRIÇÃO / VALOR / QTY / SUBTOTAL
- TOTAL em vermelho

### Form (`src/pages/NovaProposta.tsx`)
- Novos campos cliente: Endereço, CPF/CNPJ, E-mail
- Campo "Nota" do orçamento
- Cada item: Valor unit + Quantidade + Subtotal
- Removido: desconto, setup, investimento_trafego (UI)

### SERVICOS_PADRAO (`src/types/proposta.ts`)
Substituído por catálogo MG:
- Sacola de Papel (R$ 2,50)
- Sacola Boca Vazada (R$ 0,95)
- Sacola Plástica Alça Camiseta (R$ 0,45)
- Caixa Personalizada (R$ 4,00)

---

## Setup novo cliente

### 1. Supabase novo projeto
1. Criar projeto novo em supabase.com
2. Copiar **URL** e **anon key**
3. Rodar todas migrations em `supabase/migrations/` na ordem
4. Deploy edge functions: `supabase functions deploy google-oauth-exchange google-sync-calendar`

### 2. .env
```
VITE_SUPABASE_URL=https://SEU_NOVO_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_anon_key_nova
VITE_GOOGLE_CLIENT_ID=opcional_se_for_usar_agenda
```

### 3. Vercel
Novo projeto Vercel apontando pra este repo + env vars acima.

### 4. Logo
Substituir `public/logo-mg.png` pelo PNG real da MG.

---

## Pendências não aplicadas (decisões pendentes)

- **Vendas.tsx / Dashboard.tsx**: mantém analytics por categoria (Tráfego/Social/Sites). Para MG faz menos sentido. Reescrever quando necessário (não bloqueia operação básica).
- **Categorização** em Propostas.tsx: regex pra "Tráfego/Social" — itens MG cairão em "outros". Refatorar quando virar prioridade.
- **Schema 100% limpo**: dropar `valor_setup`/`desconto_*`/`investimento_trafego` se não voltarem. Migration separada quando confirmar que ninguém usa.

---

## Build & Deploy

```bash
npm install
npm run build      # produz dist/
npm run dev        # dev server
```

Type-check OK + build OK em ~19s (verificado).
