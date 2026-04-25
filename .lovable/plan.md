# Ubroker — Static Visual MVP

A fully static, frontend-only build. No backend, no auth, no database, no APIs. Every screen rendered from rich fictional data so it feels like a real working product.

## Visual direction

Hybrid editorial-SaaS:
- **Palette**: `#0B1F3B` deep navy (primary surface), `#FFFFFF`, `#2563EB` blue accent, `#1F2937` graphite, `#F3F4F6` soft gray. A subtle warm accent (amber/orange) reserved only for CTAs on the landing page, à la the Pilar reference.
- **Typography**: Inter throughout. Oversized display headlines (clamp 56–104px) on the landing, tight numeric typography in the product (tabular-nums for KPIs).
- **Feel**: Premium, data-forward, generous whitespace, sharp 8px radii, hairline 1px dividers, no heavy shadows.

## Route map

```text
/                    Landing page (public)
/app                 Dashboard
/app/leads           Leads list
/app/pipeline        Kanban
/app/imoveis         Inventory + "Adicionar imóvel" modal
/app/parcerias       Brokers grid
/app/parcerias/$id   Broker profile + their inventory
/app/atividades      Activity timeline
/app/ia              AI Assistant simulation
/app/inbox           Omnichannel inbox
/app/ganhos          Earnings
/app/indicacoes      Referrals
/app/perfil          Profile
/app/configuracoes   Settings
```

Each `/app/*` route lives under a layout route (`app.tsx`) with sidebar nav (CORE / PRODUTIVIDADE / MONETIZAÇÃO / SUPORTE groups) + topbar (search, notifications, avatar "Ramon Cardozo Capone — Plano Free").

## 1. Landing page (/)

Inspired by the Pilar references, adapted to Ubroker positioning (productivity + monetization + partnerships for brokers).

Sections:
1. **Sticky header** — logo "Ubroker", links (A plataforma, Soluções, Parcerias, Preços, Blog), CTA "Ver demo" → `/app`.
2. **Hero** — navy background, oversized headline *"Corretores no controle."*, subheadline about leading high-end real estate productivity, primary CTA "Ver demo" + secondary "Falar com vendas". Right-side angled image mask (broker working) like the Pilar hero.
3. **Stats band** — `+R$ 3,5 bi VGV` · `+39k imóveis` · `+750 corretores` · `4 cidades` (editorial type, hairline dividers).
4. **"Trabalhe sem trabalhar sozinho"** — 4 dark cards: *Construímos sua marca*, *Potencializamos seus ganhos*, *Aumentamos sua produtividade*, *Reduzimos seu risco*. One card flipped white with the blue "+" affordance like the reference.
5. **Product showcase** — angled mockup of the Ubroker dashboard with caption *"Painel do corretor. Dados em tempo real."*
6. **Diferenciais** — 3-column: Pipeline e leads centralizados / IA + omnichannel / Rede de parcerias com comissão compartilhada.
7. **Depoimentos** — carousel of 3 broker testimonial cards (photo, name, agency).
8. **Mídia / "Na imprensa"** — Valor / Exame / InfoMoney mock cards.
9. **CTA final** — *"Pronto para subir de nível?"* with "Ver demo gratuita".
10. **Footer** — institutional, social, legal.

## 2. Product screens (rich fictional data)

### Dashboard `/app`
KPI grid (VGV R$ 3.200.000 · Faturamento R$ 96.000 · Comissão média 3% · Vendidos no mês 2 · Ticket médio R$ 800.000), operations block (Leads novos 18 / Em atendimento 12 / Propostas 5), monetization block (Ganhos com indicação R$ 480, progress bar "Faltam R$ 120 para isentar sua mensalidade"), sales evolution line chart (recharts, last 6 months), recent activity feed.

### Leads `/app/leads`
Table + side detail panel. ~22 leads with name, origin (Instagram, WhatsApp, Marketplace, Indicação, Outro com texto livre tipo "evento Casa Cor", "indicação de cliente antigo"), interest (rich paragraphs: *"João, casado, 3 filhos, home office, busca casa com área externa, próxima a escola, orçamento R$ 1.000.000"*), status pill, last interaction timestamp, interaction history mini-timeline.

### Pipeline `/app/pipeline`
Kanban with exact counts: Novo (6) · Qualificado (5) · Visita (4) · Proposta (3) · Fechado (2). Cards show client, property of interest, value, days in stage. Drag visuals only (no persistence).

### Imóveis `/app/imoveis`
Card grid + "Adicionar imóvel" button opening a modal with realistic form (cosmetic only). Each card: name (*"Apartamento 3 quartos em Icaraí"*), value, hero photo, descriptive paragraph, badge "Disponível no marketplace B2C". 12 fictional listings across Niterói/RJ/SP.

### Parcerias `/app/parcerias`
Grid of broker cards: photo, name, region, especialidade, nº de imóveis, compatibility seal (Alta/Média/Baixa with color coding), actions "Ver perfil" / "Solicitar parceria".

### Parceria detail `/app/parcerias/$id`
Broker bio + full inventory grid. Each property has *"Solicitar parceria neste imóvel"* button. No feed, no likes, no posts.

### Atividades `/app/atividades`
Vertical timeline grouped by day: ligações agendadas, visitas, follow-ups, with client names and notes.

### IA Assistente `/app/ia`
Split view: left = list of conversations the AI is handling; right = live transcript showing the AI qualifying a lead in real time (typed-out messages, extracted fields panel: orçamento, região, prazo, perfil familiar, status: "Lead qualificado ✓"). Looks fully functional.

### Inbox `/app/inbox`
Three-pane omnichannel: channel filter (WhatsApp / Instagram / Marketplace), conversation list with unread badges, conversation view with message bubbles, lead identity card on the right.

### Ganhos `/app/ganhos`
Receita total R$ 96.480, breakdown (Comissão R$ 96.000 + SaaS R$ 480), donut chart, transaction history table (vendas + recorrência de indicações).

### Indicações `/app/indicacoes`
Referral link with copy button, 4 active referrals (name, plan, MRR contribution, status), explanatory copy *"Indique corretores e ganhe sobre as assinaturas das ferramentas"*.

### Perfil `/app/perfil`
Ramon Cardozo Capone, Plano Free, Niterói, avatar, contact info, CRECI mock.

### Configurações `/app/configuracoes`
Notifications toggles, preferences, language, theme (visual only).

## Technical notes

- TanStack Start file-based routing. Layout route `src/routes/app.tsx` with sidebar + `<Outlet />`; children as `app.leads.tsx`, `app.parcerias.$id.tsx`, etc.
- All data lives in `src/data/*.ts` modules (leads, properties, brokers, conversations, activities, earnings) — typed, realistic, plenty of variety.
- Charts via `recharts` (already in shadcn ecosystem); UI from existing shadcn components.
- No auth, no Supabase, no server functions. Forms are visual; submits are no-ops or local state.
- Per-route `head()` metadata on landing for proper SEO/social previews.
- Responsive: landing fully responsive; product UI optimized for desktop with a tasteful mobile fallback.

## Out of scope (per PRD)
No DB, no auth, no APIs, no persistence, no real integrations, no social feed/likes/posts in Parcerias.
