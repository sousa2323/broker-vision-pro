## Evolução da tela Configurações — Central de controle do corretor

Único arquivo alterado: `src/routes/app.configuracoes.tsx`. Estrutura de cards mantida e enriquecida — nenhuma seção atual removida. Sem alterações em mocks, rotas ou outras telas.

## Layout final (top → bottom)

```text
┌─ Configurações ─────────────────────────────────────────────┐
│ Subtítulo: "Controle como o sistema trabalha por você."    │
└─────────────────────────────────────────────────────────────┘
┌─ Notificações  (Bell) ──────────────────────────────────────┐
│ "Escolha quando e como deseja ser avisado..."              │
│  ── LEADS ──                                                │
│   • Novo lead por e-mail                                    │
│   • Novo lead via push                                      │
│  ── PARCERIAS ──                                            │
│   • Convites de parceria                                    │
│   • Atualizações de proposta                                │
│   • Parceria fechada (novo)                                 │
│  ── PERFORMANCE ──                                          │
│   • Resumo diário (18h)                                     │
│   • Insights semanais da IA (novo)                          │
└─────────────────────────────────────────────────────────────┘
┌─ Automação de processos  (Zap)  NOVO ───────────────────────┐
│ "Deixe o sistema trabalhar por você."                       │
│ • Criar atividade automática ao receber lead                │
│ • Criar follow-up após 24h sem resposta                     │
│ • Sugerir imóveis automaticamente via IA                    │
│ • Lembrar de atualizar etapa do pipeline                    │
└─────────────────────────────────────────────────────────────┘
┌─ Privacidade e visibilidade  (Eye)  NOVO ───────────────────┐
│ "Controle como você participa do ecossistema."             │
│ • Tornar meu perfil visível para outros corretores          │
│ • Permitir receber solicitações de parceria                 │
│ • Exibir meus imóveis para a rede                           │
└─────────────────────────────────────────────────────────────┘
┌─ Preferências  (Globe) ─────────────────────────────────────┐
│ Idioma · Fuso horário · Moeda  → dropdowns visuais (Select) │
└─────────────────────────────────────────────────────────────┘
┌─ Aparência  (Moon) ─────────────────────────────────────────┐
│ • Modo escuro                                               │
│ • Densidade da interface (Compacto / Confortável) — chips   │
└─────────────────────────────────────────────────────────────┘
┌─ Plano e cobrança  (CreditCard)  NOVO ──────────────────────┐
│ Plano atual: Free       Valor: R$ 0/mês                     │
│ Recursos: chips (IA Assistente, Inbox, Indicações)          │
│ Próxima cobrança: —                                         │
│ [ Gerenciar plano ]   (warm CTA)                            │
└─────────────────────────────────────────────────────────────┘
┌─ Integrações  (Smartphone) ─────────────────────────────────┐
│ WhatsApp · Conectado          [ Gerenciar ]                 │
│ Instagram · @ramoncapone...   [ Gerenciar ]                 │
│ Site / Landing page · —       [ Conectar ]                  │
│ Marketplace B2C · Sincronizado [ Gerenciar ]                │
└─────────────────────────────────────────────────────────────┘
┌─ Segurança  (Lock)  (mantido) ──────────────────────────────┐
│ Autenticação 2FA · Última sessão                            │
└─────────────────────────────────────────────────────────────┘
```

## Mudanças por bloco

### Header
- Manter título "Configurações". Adicionar subtítulo `text-sm text-muted-foreground`: "Controle como o sistema trabalha por você."

### Notificações (existente — reorganizar)
- Adicionar microtexto no topo do card: "Escolha quando e como deseja ser avisado sobre oportunidades e atividades importantes."
- Quebrar em 3 subgrupos com label `text-[11px] uppercase tracking-widest text-muted-foreground` (LEADS, PARCERIAS, PERFORMANCE).
- Manter toggles atuais e adicionar: "Parceria fechada", "Insights semanais da IA".
- Adicionar chaves correspondentes ao `useState` `s`.

### Automação de processos (NOVO)
- Card novo com ícone `Zap` (lucide).
- Microtexto: "Deixe o sistema trabalhar por você."
- 4 toggles: criarAtividade, followup24h, sugerirImoveis, lembrarPipeline.

### Privacidade e visibilidade (NOVO)
- Card novo com ícone `Eye`.
- Microtexto: "Controle sua participação no ecossistema."
- 3 toggles: perfilVisivel (on), aceitaParcerias (on), exibeImoveisRede (on).

### Preferências (existente — leve ajuste)
- Substituir as 3 linhas `Pref` por um novo helper `PrefSelect` que renderiza um `Select` shadcn com 2-3 opções visuais por campo (Idioma: PT-BR/EN-US/ES; Fuso: GMT-3, GMT-2, GMT+0; Moeda: BRL, USD, EUR). Estado local via `useState`.

### Aparência (existente)
- Manter toggle "Modo escuro".
- Adicionar linha "Densidade da interface" com 2 chips (Compacto / Confortável). Estado local string `densidade`.

### Plano e cobrança (NOVO)
- Card novo com ícone `CreditCard`.
- Linhas tipo `Pref`: Plano atual (Free), Valor mensal (R$ 0/mês), Próxima cobrança (—).
- Linha "Recursos ativos" com chips: "IA Assistente", "Inbox", "Indicações".
- Botão `bg-warm text-warm-foreground` "Gerenciar plano" alinhado à direita.

### Integrações (existente — enriquecer)
- Substituir as 3 linhas `Pref` por um helper `Integracao({nome, status, conectado})` com badge verde "Conectado" / cinza "—" e botão `Gerenciar`/`Conectar` à direita.
- Itens: WhatsApp Business (conectado), Instagram (conectado), Site / Landing page (não conectado, novo), Marketplace B2C (sincronizado, manter).

### Segurança (manter)
- Sem mudanças.

## Detalhes técnicos
- Imports adicionais: `Zap`, `Eye`, `CreditCard` de `lucide-react`; `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` de `@/components/ui/select`.
- Expandir o objeto `s` do `useState` para incluir todas as novas flags.
- Criar helpers locais: `SubGroup({label, children})`, `PrefSelect({label, value, options, onChange})`, `Integracao({nome, sub, conectado})`, `Chip({label, active, onClick})` (para densidade e recursos).
- `max-w-3xl` mantido. Espaçamento `space-y-6` mantido.
- Reaproveitar `Section`, `Toggle`, `Pref` existentes onde aplicável.
- Sem novas rotas, sem mudanças de mock, sem novas dependências.

## Não alterar
- `src/data/mock.ts`, sidebar, rotas, outras telas.
- Identidade visual (`bg-card`, `bg-navy`, `bg-warm`, `text-muted-foreground`).
- Estrutura visual em cards e componentes `Section`/`Toggle`/`Pref`.
