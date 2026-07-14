import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Mail,
  Menu,
  MessageSquare,
  Shield,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import { UbrokerLogo } from "@/components/ubroker-logo";

const salesContact = "mailto:contato@ubroker.com.br?subject=Quero%20conhecer%20a%20Ubroker";

const navItems = [
  { href: "#plataforma", label: "A plataforma" },
  { href: "#solucoes", label: "Soluções" },
  { href: "#parcerias", label: "Parcerias" },
  { href: "#confianca", label: "Confiança" },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm focus-visible:ring-offset-2 focus-visible:ring-offset-navy";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ubroker — Corretores no controle" },
      {
        name: "description",
        content:
          "A plataforma que dá aos corretores controle total: leads, pipeline, IA, omnichannel, parcerias e monetização SaaS.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen overflow-x-clip bg-navy text-navy-foreground">
      <Header />
      <main>
        <Hero />
        <StatsBand />
        <ValueProposition />
        <ProductShowcase />
        <Differentials />
        <Testimonials />
        <TrustBand />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="Ubroker — página inicial" className={focusRing}>
          <UbrokerLogo />
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-8 text-sm md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`rounded-sm px-1 py-2 text-white/70 transition-colors duration-150 hover:text-white ${focusRing}`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-semibold text-white transition-colors duration-150 hover:border-white/40 hover:bg-white/5 sm:px-5 ${focusRing}`}
          >
            Entrar
            <ArrowRight className="hidden h-4 w-4 sm:block" aria-hidden="true" />
          </Link>
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMobileOpen((open) => !open)}
            className={`grid h-11 w-11 place-items-center rounded-md text-white transition-colors hover:bg-white/10 md:hidden ${focusRing}`}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <nav
          id="mobile-navigation"
          aria-label="Navegação mobile"
          className="border-t border-white/10 bg-navy px-4 pb-5 pt-3 md:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex min-h-11 items-center border-b border-white/10 text-sm font-medium text-white/80 transition-colors hover:text-white ${focusRing}`}
              >
                {item.label}
              </a>
            ))}
            <a
              href={salesContact}
              onClick={() => setMobileOpen(false)}
              className={`mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-warm px-5 text-sm font-semibold text-warm-foreground transition-[filter] hover:brightness-110 ${focusRing}`}
            >
              Falar com um especialista
              <Mail className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden px-4 sm:px-6">
      <video
        src="/video-hero.mp4"
        aria-hidden="true"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-r from-navy via-navy/85 to-navy/30"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-t from-navy/60 to-transparent"
      />

      <div className="mx-auto flex min-h-[calc(100svh-72px)] max-w-7xl items-center py-14 md:py-16">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-6 max-w-md text-sm font-semibold text-warm">
            Seu negócio, sua marca, sua carteira.
          </p>
          <h1 className="max-w-[10ch] text-balance font-display text-[clamp(3.25rem,6.2vw,5.75rem)] leading-[0.96] tracking-[-0.02em]">
            Corretores no controle.
          </h1>
          <p className="mt-7 max-w-[38rem] text-pretty text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
            A Ubroker reúne operação, rede e tecnologia para o corretor de alto padrão construir uma
            marca própria, trabalhar oportunidades e crescer sem depender de várias ferramentas.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/login"
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/5 hover:text-white ${focusRing}`}
            >
              Já sou cliente
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBand() {
  const stats = [
    { value: "+R$ 3,5 bi", label: "em VGV transacionado" },
    { value: "+39 mil", label: "imóveis centralizados" },
    { value: "+750", label: "corretores na rede" },
    { value: "4 cidades", label: "com operação conectada" },
  ];

  return (
    <section id="plataforma" className="scroll-mt-[72px] border-y border-white/10 bg-white/[0.025]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`px-4 py-9 sm:px-6 md:py-12 ${
              index % 2 === 0 ? "border-r border-white/10" : ""
            } ${index < 2 ? "border-b border-white/10 md:border-b-0" : ""} ${
              index > 0 ? "md:border-l md:border-white/10" : "md:border-l-0"
            } md:border-r-0`}
          >
            <div className="num font-display text-[clamp(2rem,3.5vw,3.25rem)] leading-none tracking-[-0.02em]">
              {stat.value}
            </div>
            <p className="mt-3 max-w-[16ch] text-sm leading-5 text-white/60">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ValueProposition() {
  const outcomes = [
    {
      icon: Users,
      title: "Uma marca que pertence a você",
      body: "Presença profissional e relacionamento omnichannel para transformar reputação em ativo comercial.",
      result: "Mais autoridade no mercado",
    },
    {
      icon: TrendingUp,
      title: "Mais receita por oportunidade",
      body: "Comissões compartilhadas, indicações recorrentes e uma rede pronta para ampliar seu alcance.",
      result: "Mais caminhos para monetizar",
    },
    {
      icon: Zap,
      title: "Operação em um só lugar",
      body: "Leads, pipeline, agenda, IA e canais de atendimento conectados ao mesmo fluxo de trabalho.",
      result: "Menos troca de ferramentas",
    },
    {
      icon: Shield,
      title: "Estrutura para decidir melhor",
      body: "Parcerias, contratos e suporte para diversificar a carteira sem perder controle ou rastreabilidade.",
      result: "Menos risco operacional",
    },
  ];

  return (
    <section id="solucoes" className="scroll-mt-[72px] px-4 py-24 sm:px-6 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] md:items-end md:gap-16">
          <h2 className="max-w-[13ch] text-balance font-display text-[clamp(2.75rem,5vw,4.75rem)] leading-[0.98] tracking-[-0.02em]">
            Independência não precisa ser isolamento.
          </h2>
          <div className="max-w-lg md:justify-self-end">
            <p className="text-pretty text-base leading-7 text-white/75">
              A Ubroker combina autonomia, tecnologia e colaboração para o corretor conduzir um
              negócio de alto valor com mais previsibilidade.
            </p>
            <a
              href="#produto"
              className={`mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-warm transition-colors hover:text-white ${focusRing}`}
            >
              Ver a operação por dentro
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="mt-16 grid gap-x-12 md:grid-cols-2">
          {outcomes.map((outcome) => (
            <article key={outcome.title} className="border-t border-white/15 py-8 sm:py-10">
              <outcome.icon className="h-6 w-6 text-warm" strokeWidth={1.6} aria-hidden="true" />
              <h3 className="mt-7 max-w-[22ch] text-balance font-display text-2xl leading-tight">
                {outcome.title}
              </h3>
              <p className="mt-4 max-w-[52ch] text-sm leading-6 text-white/70">{outcome.body}</p>
              <p className="mt-6 flex items-center gap-2 text-sm font-medium text-white/90">
                <Check className="h-4 w-4 text-warm" aria-hidden="true" />
                {outcome.result}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductShowcase() {
  return (
    <section
      id="produto"
      className="scroll-mt-[72px] bg-surface px-4 py-24 text-ink sm:px-6 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)] md:items-end md:gap-16">
          <div>
            <p className="text-sm font-semibold text-brand">Produto em ação</p>
            <h2 className="mt-4 max-w-[14ch] text-balance font-display text-[clamp(2.75rem,4.5vw,4.25rem)] leading-none tracking-[-0.02em]">
              Um painel para enxergar o negócio inteiro.
            </h2>
          </div>
          <p className="max-w-lg text-pretty text-base leading-7 text-muted-foreground md:justify-self-end">
            Prioridades, oportunidades e receita no mesmo contexto para você agir sem alternar entre
            planilhas, agendas e sete ferramentas diferentes.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex min-h-12 items-center justify-between gap-4 border-b border-border bg-surface px-4 sm:px-5">
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-xs font-semibold text-brand-foreground">
                U
              </span>
              <span className="text-sm font-semibold">Visão geral</span>
            </div>
            <span className="text-xs text-muted-foreground">Atualizado agora</span>
          </div>

          <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(240px,0.65fr)] lg:gap-6 lg:p-8">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { label: "VGV", value: "R$ 3,2 mi" },
                { label: "Faturamento", value: "R$ 96 mil" },
                { label: "Ticket médio", value: "R$ 800 mil" },
                { label: "Vendidos", value: "2 por mês" },
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl border border-border p-4 sm:p-5">
                  <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                  <p className="num mt-2 font-display text-xl sm:text-2xl">{metric.value}</p>
                </div>
              ))}

              <div className="col-span-2 rounded-xl border border-border p-4 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-medium text-muted-foreground">Evolução de vendas</p>
                  <p className="num text-xs font-semibold text-success">+18% no período</p>
                </div>
                <svg
                  viewBox="0 0 400 100"
                  className="mt-5 h-28 w-full sm:h-32"
                  role="img"
                  aria-label="Gráfico de evolução de vendas em alta"
                >
                  <polyline
                    fill="none"
                    stroke="oklch(0.55 0.22 262)"
                    strokeWidth="2.5"
                    points="0,72 60,55 120,62 180,30 240,42 300,18 360,8 400,12"
                  />
                  <polyline
                    fill="oklch(0.55 0.22 262 / 12%)"
                    stroke="none"
                    points="0,72 60,55 120,62 180,30 240,42 300,18 360,8 400,12 400,100 0,100"
                  />
                </svg>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-xl bg-navy p-5 text-navy-foreground sm:p-6">
                <p className="text-xs font-medium text-white/65">Monetização por indicação</p>
                <p className="num mt-3 font-display text-3xl">R$ 480</p>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  Faltam R$ 120 para isentar sua mensalidade.
                </p>
                <div
                  className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/15"
                  aria-hidden="true"
                >
                  <div className="h-full w-4/5 bg-warm" />
                </div>
              </div>

              <div className="rounded-xl border border-border p-5">
                <p className="text-xs font-medium text-muted-foreground">Operação de hoje</p>
                <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
                  {[
                    { value: 18, label: "Novos" },
                    { value: 12, label: "Em contato" },
                    { value: 5, label: "Propostas" },
                  ].map((item) => (
                    <div key={item.label}>
                      <dt className="num font-display text-xl">{item.value}</dt>
                      <dd className="mt-1 text-xs text-muted-foreground">{item.label}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <Link
                to="/login"
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 ${focusRing}`}
              >
                Acessar minha conta
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Differentials() {
  const items = [
    {
      icon: Zap,
      title: "Pipeline e leads centralizados",
      body: "Toda a jornada do cliente, do primeiro contato ao fechamento, em um fluxo com prioridades visíveis.",
    },
    {
      icon: MessageSquare,
      title: "IA e canais trabalhando juntos",
      body: "Atendimento, qualificação e contexto reunidos para o corretor entrar quando a conversa pede decisão humana.",
    },
    {
      icon: Users,
      title: "Parcerias que viram negócio",
      body: "Inventário conectado, solicitação de parceria e comissão compartilhada sem feed, ruído ou negociação dispersa.",
    },
  ];

  return (
    <section id="parcerias" className="scroll-mt-[72px] px-4 py-24 sm:px-6 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-24">
        <div>
          <h2 className="max-w-[12ch] text-balance font-display text-[clamp(2.75rem,4.6vw,4.5rem)] leading-[0.98] tracking-[-0.02em]">
            Tecnologia onde ela muda o resultado.
          </h2>
          <p className="mt-6 max-w-md text-pretty text-base leading-7 text-white/70">
            A Ubroker não adiciona recursos por espetáculo. Cada frente reduz trabalho manual,
            amplia alcance ou protege uma decisão comercial.
          </p>
        </div>

        <div className="border-b border-white/15">
          {items.map((item, index) => (
            <article
              key={item.title}
              className="grid gap-5 border-t border-white/15 py-8 sm:grid-cols-[48px_minmax(0,1fr)] sm:gap-7 sm:py-9"
            >
              <div className="flex items-start gap-4 sm:block">
                <span className="num text-sm text-white/45">0{index + 1}</span>
                <item.icon
                  className="mt-0.5 h-6 w-6 text-warm sm:mt-5"
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(0,0.8fr)_minmax(260px,1.2fr)] md:gap-8">
                <h3 className="max-w-[22ch] text-balance font-display text-2xl leading-tight">
                  {item.title}
                </h3>
                <p className="max-w-[58ch] text-sm leading-6 text-white/70">{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const testimonials = [
    {
      name: "Alessandra Freixo",
      role: "Olhar de Corretora · Niterói",
      initials: "AF",
      quote:
        "Em quatro meses dobrei meu pipeline qualificado. A IA da Ubroker virou minha sócia silenciosa.",
    },
    {
      name: "Aldemar e Thiago",
      role: "Homesphere · Maricá",
      initials: "AT",
      quote:
        "Fechamos três vendas em parceria via Ubroker no primeiro mês. A rede funciona de verdade.",
    },
    {
      name: "Denise Molinaro",
      role: "Denise no Jardins · São Paulo",
      initials: "DM",
      quote:
        "Indicar clientes que estão saindo de São Paulo virou receita recorrente para o meu negócio.",
    },
  ];

  return (
    <section className="bg-surface px-4 py-24 text-ink sm:px-6 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.6fr)] md:items-end md:gap-16">
          <h2 className="max-w-[13ch] text-balance font-display text-[clamp(2.75rem,4.5vw,4.25rem)] leading-none tracking-[-0.02em]">
            Resultados contados por quem opera em rede.
          </h2>
          <p className="max-w-md text-pretty text-base leading-7 text-muted-foreground md:justify-self-end">
            Mais do que funcionalidades, o que importa é transformar relacionamento, carteira e
            tempo em negócio fechado.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <blockquote className="flex min-h-[360px] flex-col justify-between rounded-2xl bg-navy p-7 text-navy-foreground sm:p-10">
            <p className="max-w-[28ch] text-pretty font-display text-[clamp(2rem,3.3vw,3.25rem)] leading-[1.08] tracking-[-0.02em]">
              “{testimonials[0].quote}”
            </p>
            <footer className="mt-12 flex items-center gap-4 border-t border-white/15 pt-6">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-warm text-sm font-semibold text-warm-foreground">
                {testimonials[0].initials}
              </span>
              <div>
                <cite className="not-italic font-semibold">{testimonials[0].name}</cite>
                <p className="mt-1 text-sm text-white/60">{testimonials[0].role}</p>
              </div>
            </footer>
          </blockquote>

          <div className="flex flex-col border-b border-border">
            {testimonials.slice(1).map((testimonial) => (
              <blockquote
                key={testimonial.name}
                className="flex flex-1 flex-col justify-between border-t border-border py-7 sm:p-7 sm:first:pt-7"
              >
                <p className="max-w-[48ch] text-pretty text-lg leading-7 text-foreground">
                  “{testimonial.quote}”
                </p>
                <footer className="mt-8 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
                    {testimonial.initials}
                  </span>
                  <div>
                    <cite className="not-italic text-sm font-semibold">{testimonial.name}</cite>
                    <p className="mt-0.5 text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBand() {
  const items = [
    {
      icon: Shield,
      title: "Operação com rastreabilidade",
      body: "Dados, atividades e responsabilidades visíveis no mesmo fluxo.",
    },
    {
      icon: Check,
      title: "Parcerias com contexto",
      body: "Termos, imóvel e comissão reunidos antes da decisão.",
    },
    {
      icon: TrendingUp,
      title: "Receita com leitura clara",
      body: "VGV, comissão e recorrência apresentados com período e unidade.",
    },
  ];

  return (
    <section
      id="confianca"
      className="scroll-mt-[72px] border-y border-white/10 px-4 py-20 sm:px-6"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(220px,0.55fr)_minmax(0,1.45fr)] lg:gap-16">
          <div>
            <p className="text-sm font-semibold text-warm">Confiança para operar</p>
            <h2 className="mt-4 max-w-[11ch] text-balance font-display text-4xl leading-none">
              Estrutura que sustenta decisões de alto valor.
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {items.map((item) => (
              <article key={item.title} className="border-t border-white/15 pt-6">
                <item.icon className="h-5 w-5 text-warm" strokeWidth={1.7} aria-hidden="true" />
                <h3 className="mt-5 text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/65">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section id="contato" className="scroll-mt-[72px] px-4 py-24 sm:px-6 md:py-32">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="mx-auto max-w-[13ch] text-balance font-display text-[clamp(3rem,6vw,5.75rem)] leading-[0.96] tracking-[-0.02em]">
          Seu próximo negócio pode começar com mais controle.
        </h2>
        <p className="mx-auto mt-7 max-w-2xl text-pretty text-base leading-7 text-white/75 sm:text-lg">
          Conheça a plataforma com alguém do time Ubroker ou acesse sua conta para continuar sua
          operação.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={salesContact}
            className={`inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-warm px-6 text-sm font-semibold text-warm-foreground transition-[filter,transform] duration-200 hover:-translate-y-0.5 hover:brightness-110 motion-reduce:transform-none ${focusRing}`}
          >
            Falar com um especialista
            <Mail className="h-4 w-4" aria-hidden="true" />
          </a>
          <Link
            to="/login"
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/5 ${focusRing}`}
          >
            Entrar na plataforma
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 py-14 text-sm text-white/60 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(160px,0.4fr))]">
        <div>
          <UbrokerLogo />
          <p className="mt-5 max-w-sm text-pretty leading-6">
            A plataforma de operação, rede e crescimento para o corretor de alto padrão brasileiro.
          </p>
          <a
            href={salesContact}
            className={`mt-5 inline-flex min-h-11 items-center gap-2 rounded-sm text-white/70 transition-colors hover:text-white ${focusRing}`}
          >
            contato@ubroker.com.br
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">Conheça</h2>
          <ul className="mt-4 space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={`inline-flex min-h-9 items-center rounded-sm transition-colors hover:text-white ${focusRing}`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">Conta</h2>
          <ul className="mt-4 space-y-1">
            <li>
              <Link
                to="/login"
                className={`inline-flex min-h-9 items-center rounded-sm transition-colors hover:text-white ${focusRing}`}
              >
                Entrar
              </Link>
            </li>
            <li>
              <a
                href={salesContact}
                className={`inline-flex min-h-9 items-center rounded-sm transition-colors hover:text-white ${focusRing}`}
              >
                Falar com o time
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Ubroker. Todos os direitos reservados.</p>
        <p className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5" aria-hidden="true" />
          Boas práticas e conformidade para corretores
        </p>
      </div>
    </footer>
  );
}
