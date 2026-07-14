import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Check, Mail, Menu, Shield, X } from "lucide-react";
import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import { UbrokerLogo } from "@/components/ubroker-logo";
import {
  CountUp,
  LandingMotion,
  Reveal,
  RevealGroup,
  RevealItem,
  itemVariants,
} from "@/components/landing/motion";

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
    <LandingMotion>
      <div className="min-h-screen overflow-x-clip bg-navy text-navy-foreground">
        <div className="grain-overlay" aria-hidden="true" />
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
    </LandingMotion>
  );
}

/** Assinatura editorial das seções: número + rótulo + régua hairline. */
function Eyebrow({
  n,
  label,
  tone = "dark",
  center = false,
  className = "",
}: {
  n: string;
  label: string;
  tone?: "dark" | "light";
  center?: boolean;
  className?: string;
}) {
  const rule = tone === "dark" ? "bg-white/15" : "bg-border";
  const text = tone === "dark" ? "text-white/60" : "text-muted-foreground";
  return (
    <p className={`flex items-center gap-4 text-sm font-semibold ${className}`}>
      {center ? <span aria-hidden="true" className={`h-px flex-1 ${rule}`} /> : null}
      <span className="num text-warm">{n}</span>
      <span className={text}>{label}</span>
      <span aria-hidden="true" className={`h-px flex-1 ${rule}`} />
    </p>
  );
}

/** Foto duotone (unificada com o navy da marca) com parallax vertical leve. */
function ParallaxPhoto({
  src,
  alt,
  caption,
  aspectClass,
  width,
  height,
  captionTone = "dark",
}: {
  src: string;
  alt: string;
  caption: string;
  aspectClass: string;
  width: number;
  height: number;
  captionTone?: "dark" | "light";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-16, 16]);

  return (
    <figure>
      <div ref={ref} className={`relative overflow-hidden ${aspectClass}`}>
        <m.img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className="h-full w-full scale-110 object-cover saturate-[.85]"
          style={reducedMotion ? undefined : { y }}
        />
        <div className="absolute inset-0 bg-navy/25 mix-blend-multiply" aria-hidden="true" />
      </div>
      <figcaption
        className={`mt-4 flex items-center gap-4 border-t pt-4 text-xs ${
          captionTone === "dark" ? "border-white/15 text-white/45" : "border-border text-muted-foreground"
        }`}
      >
        {caption}
      </figcaption>
    </figure>
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
  const sectionRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const veilOpacity = useTransform(scrollYProgress, [0, 1], [0, 0.45]);

  return (
    <section
      ref={sectionRef}
      className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden px-4 sm:px-6"
    >
      <m.div
        aria-hidden="true"
        className="absolute inset-0 -z-10 will-change-transform"
        style={reducedMotion ? undefined : { scale: videoScale }}
      >
        <video
          src="/video-hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      </m.div>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-r from-navy via-navy/85 to-navy/30"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-t from-navy/60 to-transparent"
      />
      <m.div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-navy"
        style={reducedMotion ? { opacity: 0 } : { opacity: veilOpacity }}
      />

      <div className="relative mx-auto flex min-h-[calc(100svh-72px)] max-w-7xl items-center py-14 md:py-16">
        <m.div
          className="relative z-10 max-w-2xl"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
          }}
        >
          <m.p variants={itemVariants(28)} className="mb-6 max-w-md text-sm font-semibold text-warm">
            Seu negócio, sua marca, sua carteira.
          </m.p>
          <m.h1
            variants={itemVariants(28)}
            className="max-w-[10ch] text-balance font-display text-[clamp(3.25rem,6.2vw,5.75rem)] leading-[0.96] tracking-[-0.02em]"
          >
            Corretores no controle.
          </m.h1>
          <m.p
            variants={itemVariants(28)}
            className="mt-7 max-w-[38rem] text-pretty text-base leading-7 text-white/80 sm:text-lg sm:leading-8"
          >
            A Ubroker reúne operação, rede e tecnologia para o corretor de alto padrão construir uma
            marca própria, trabalhar oportunidades e crescer sem depender de várias ferramentas.
          </m.p>
          <m.div
            variants={itemVariants(28)}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <a
              href={salesContact}
              className={`inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-warm px-6 text-sm font-semibold text-warm-foreground transition-[filter,transform] duration-200 hover:-translate-y-0.5 hover:brightness-110 motion-reduce:transform-none ${focusRing}`}
            >
              Falar com um especialista
              <Mail className="h-4 w-4" aria-hidden="true" />
            </a>
            <Link
              to="/login"
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/5 hover:text-white ${focusRing}`}
            >
              Já sou cliente
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </m.div>
        </m.div>

        <a
          href="#plataforma"
          className={`absolute bottom-8 left-0 z-10 flex items-center gap-4 rounded-sm text-xs font-medium text-white/50 transition-colors hover:text-white ${focusRing}`}
        >
          Explorar a plataforma
          <span aria-hidden="true" className="relative h-10 w-px overflow-hidden bg-white/25">
            <m.span
              className="absolute left-0 top-0 h-2.5 w-px bg-warm"
              animate={reducedMotion ? undefined : { y: [-10, 40] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
        </a>
      </div>
    </section>
  );
}

function StatsBand() {
  const stats = [
    { prefix: "+R$ ", to: 3.5, decimals: 1, suffix: " bi", label: "em VGV transacionado" },
    { prefix: "+", to: 39, decimals: 0, suffix: " mil", label: "imóveis centralizados" },
    { prefix: "+", to: 750, decimals: 0, suffix: "", label: "corretores na rede" },
    { prefix: "", to: 4, decimals: 0, suffix: " cidades", label: "com operação conectada" },
  ];

  return (
    <section id="plataforma" className="scroll-mt-[72px] border-y border-white/10 bg-white/[0.025]">
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <Eyebrow n="01" label="A plataforma em números" />
      </div>
      <RevealGroup className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4">
        {stats.map((stat, index) => (
          <RevealItem
            key={stat.label}
            y={16}
            className={`px-4 py-9 sm:px-6 md:py-12 ${
              index % 2 === 0 ? "border-r border-white/10" : ""
            } ${index < 2 ? "border-b border-white/10 md:border-b-0" : ""} ${
              index > 0 ? "md:border-l md:border-white/10" : "md:border-l-0"
            } md:border-r-0`}
          >
            <div className="num font-display text-[clamp(2rem,3.5vw,3.25rem)] leading-none tracking-[-0.02em]">
              <CountUp
                to={stat.to}
                prefix={stat.prefix}
                suffix={stat.suffix}
                decimals={stat.decimals}
              />
            </div>
            <p className="mt-3 max-w-[16ch] text-sm leading-5 text-white/60">{stat.label}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}

function ValueProposition() {
  const outcomes = [
    {
      title: "Uma marca que pertence a você",
      body: "Presença profissional e relacionamento omnichannel para transformar reputação em ativo comercial.",
      result: "Mais autoridade no mercado",
    },
    {
      title: "Mais receita por oportunidade",
      body: "Comissões compartilhadas, indicações recorrentes e uma rede pronta para ampliar seu alcance.",
      result: "Mais caminhos para monetizar",
    },
    {
      title: "Operação em um só lugar",
      body: "Leads, pipeline, agenda, IA e canais de atendimento conectados ao mesmo fluxo de trabalho.",
      result: "Menos troca de ferramentas",
    },
    {
      title: "Estrutura para decidir melhor",
      body: "Parcerias, contratos e suporte para diversificar a carteira sem perder controle ou rastreabilidade.",
      result: "Menos risco operacional",
    },
  ];

  return (
    <section id="solucoes" className="scroll-mt-[72px] px-4 py-24 sm:px-6 md:py-32">
      <div className="mx-auto max-w-7xl">
        <Eyebrow n="02" label="Soluções" className="mb-12" />
        <Reveal>
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
        </Reveal>

        <div className="mt-16 grid gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
          <Reveal>
            <ParallaxPhoto
              src="/landing/arch-01.jpg"
              alt="Fachada de residência contemporânea de alto padrão com piscina"
              caption="Operação de alto padrão, ponta a ponta."
              aspectClass="aspect-[4/5]"
              width={1200}
              height={1500}
            />
          </Reveal>

          <RevealGroup className="self-start border-b border-white/15">
            {outcomes.map((outcome, index) => (
              <RevealItem key={outcome.title}>
                <article className="grid gap-4 border-t border-white/15 py-8 sm:grid-cols-[48px_minmax(0,1fr)] sm:gap-7 sm:py-9">
                  <span className="num text-sm text-white/45">0{index + 1}</span>
                  <div>
                    <h3 className="max-w-[22ch] text-balance font-display text-2xl leading-tight">
                      {outcome.title}
                    </h3>
                    <p className="mt-3 max-w-[52ch] text-sm leading-6 text-white/70">
                      {outcome.body}
                    </p>
                    <p className="mt-5 flex items-center gap-2 text-sm font-medium text-white/90">
                      <Check className="h-4 w-4 text-warm" aria-hidden="true" />
                      {outcome.result}
                    </p>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
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
        <Eyebrow n="03" label="Produto em ação" tone="light" className="mb-12" />
        <Reveal>
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)] md:items-end md:gap-16">
            <h2 className="max-w-[14ch] text-balance font-display text-[clamp(2.75rem,4.5vw,4.25rem)] leading-none tracking-[-0.02em]">
              Um painel para enxergar o negócio inteiro.
            </h2>
            <p className="max-w-lg text-pretty text-base leading-7 text-muted-foreground md:justify-self-end">
              Prioridades, oportunidades e receita no mesmo contexto para você agir sem alternar
              entre planilhas, agendas e sete ferramentas diferentes.
            </p>
          </div>
        </Reveal>

        <Reveal y={32} className="mt-12">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_64px_-32px_oklch(0.21_0.05_255/0.35)]">
            <div className="flex min-h-12 items-center justify-between gap-4 border-b border-border bg-surface px-4 sm:px-5">
              <span className="text-sm font-semibold">Visão geral</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="animate-pulse-dot h-2 w-2 rounded-full bg-success"
                />
                Ao vivo
              </span>
            </div>

            <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(240px,0.65fr)] lg:gap-6 lg:p-8">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-xl border border-border p-4 sm:p-5">
                  <p className="text-xs font-medium text-muted-foreground">VGV</p>
                  <p className="num mt-2 font-display text-xl sm:text-2xl">
                    <CountUp prefix="R$ " to={3.2} decimals={1} suffix=" mi" />
                  </p>
                </div>
                <div className="rounded-xl border border-border p-4 sm:p-5">
                  <p className="text-xs font-medium text-muted-foreground">Faturamento</p>
                  <p className="num mt-2 font-display text-xl sm:text-2xl">
                    <CountUp prefix="R$ " to={96} suffix=" mil" />
                  </p>
                </div>
                <div className="rounded-xl border border-border p-4 sm:p-5">
                  <p className="text-xs font-medium text-muted-foreground">Ticket médio</p>
                  <p className="num mt-2 font-display text-xl sm:text-2xl">
                    <CountUp prefix="R$ " to={800} suffix=" mil" />
                  </p>
                </div>
                <div className="rounded-xl border border-border p-4 sm:p-5">
                  <p className="text-xs font-medium text-muted-foreground">Vendidos</p>
                  <p className="num mt-2 font-display text-xl sm:text-2xl">2 por mês</p>
                </div>

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
                    <m.path
                      d="M0 72 L60 55 L120 62 L180 30 L240 42 L300 18 L360 8 L400 12"
                      fill="none"
                      stroke="var(--brand)"
                      strokeWidth="2.5"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, ease: "easeInOut" }}
                    />
                    <m.path
                      d="M0 72 L60 55 L120 62 L180 30 L240 42 L300 18 L360 8 L400 12 L400 100 L0 100 Z"
                      fill="var(--brand)"
                      stroke="none"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 0.12 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.9 }}
                    />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-xl bg-navy p-5 text-navy-foreground sm:p-6">
                  <p className="text-xs font-medium text-white/65">Monetização por indicação</p>
                  <p className="num mt-3 font-display text-3xl">
                    <CountUp prefix="R$ " to={480} />
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    Faltam R$ 120 para isentar sua mensalidade.
                  </p>
                  <div
                    className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/15"
                    aria-hidden="true"
                  >
                    <m.div
                      className="h-full w-4/5 bg-warm"
                      style={{ transformOrigin: "left" }}
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border p-5">
                  <p className="text-xs font-medium text-muted-foreground">Operação de hoje</p>
                  <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
                    {[
                      { value: 18, label: "Novos", delay: 0 },
                      { value: 12, label: "Em contato", delay: 0.1 },
                      { value: 5, label: "Propostas", delay: 0.2 },
                    ].map((item) => (
                      <div key={item.label}>
                        <dt className="num font-display text-xl">
                          <CountUp to={item.value} delay={item.delay} />
                        </dt>
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
        </Reveal>
      </div>
    </section>
  );
}

function Differentials() {
  const items = [
    {
      title: "Pipeline e leads centralizados",
      body: "Toda a jornada do cliente, do primeiro contato ao fechamento, em um fluxo com prioridades visíveis.",
    },
    {
      title: "IA e canais trabalhando juntos",
      body: "Atendimento, qualificação e contexto reunidos para o corretor entrar quando a conversa pede decisão humana.",
    },
    {
      title: "Parcerias que viram negócio",
      body: "Inventário conectado, solicitação de parceria e comissão compartilhada sem feed, ruído ou negociação dispersa.",
    },
  ];

  return (
    <section id="parcerias" className="scroll-mt-[72px] px-4 py-24 sm:px-6 md:py-32">
      <div className="mx-auto max-w-7xl">
        <Eyebrow n="04" label="Parcerias e tecnologia" className="mb-12" />
        <div className="grid gap-14 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-24">
          <Reveal>
            <h2 className="max-w-[12ch] text-balance font-display text-[clamp(2.75rem,4.6vw,4.5rem)] leading-[0.98] tracking-[-0.02em]">
              Tecnologia onde ela muda o resultado.
            </h2>
            <p className="mt-6 max-w-md text-pretty text-base leading-7 text-white/70">
              A Ubroker não adiciona recursos por espetáculo. Cada frente reduz trabalho manual,
              amplia alcance ou protege uma decisão comercial.
            </p>
            <div className="mt-10">
              <ParallaxPhoto
                src="/landing/arch-02.jpg"
                alt="Vista aérea da orla do Rio de Janeiro ao entardecer"
                caption="Rede conectada em 4 cidades."
                aspectClass="aspect-[3/2]"
                width={1600}
                height={1067}
              />
            </div>
          </Reveal>

          <RevealGroup className="self-start border-b border-white/15">
            {items.map((item, index) => (
              <RevealItem key={item.title}>
                <article className="grid gap-5 border-t border-white/15 py-8 sm:grid-cols-[56px_minmax(0,1fr)] sm:gap-7 sm:py-9">
                  <span className="num font-display text-2xl leading-none text-warm/80">
                    0{index + 1}
                  </span>
                  <div className="grid gap-3 md:grid-cols-[minmax(0,0.8fr)_minmax(260px,1.2fr)] md:gap-8">
                    <h3 className="max-w-[22ch] text-balance font-display text-2xl leading-tight">
                      {item.title}
                    </h3>
                    <p className="max-w-[58ch] text-sm leading-6 text-white/70">{item.body}</p>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
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
      quote:
        "Em quatro meses dobrei meu pipeline qualificado. A IA da Ubroker virou minha sócia silenciosa.",
    },
    {
      name: "Aldemar e Thiago",
      role: "Homesphere · Maricá",
      quote:
        "Fechamos três vendas em parceria via Ubroker no primeiro mês. A rede funciona de verdade.",
    },
    {
      name: "Denise Molinaro",
      role: "Denise no Jardins · São Paulo",
      quote:
        "Indicar clientes que estão saindo de São Paulo virou receita recorrente para o meu negócio.",
    },
  ];

  return (
    <section id="confianca" className="scroll-mt-[72px] bg-surface px-4 py-24 text-ink sm:px-6 md:py-32">
      <div className="mx-auto max-w-7xl">
        <Eyebrow n="05" label="Confiança" tone="light" className="mb-12" />
        <Reveal>
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.6fr)] md:items-end md:gap-16">
            <h2 className="max-w-[13ch] text-balance font-display text-[clamp(2.75rem,4.5vw,4.25rem)] leading-none tracking-[-0.02em]">
              Resultados contados por quem opera em rede.
            </h2>
            <p className="max-w-md text-pretty text-base leading-7 text-muted-foreground md:justify-self-end">
              Mais do que funcionalidades, o que importa é transformar relacionamento, carteira e
              tempo em negócio fechado.
            </p>
          </div>
        </Reveal>

        <Reveal className="mt-16">
          <span
            aria-hidden="true"
            className="block font-display text-[6rem] leading-[0.5] text-warm/40"
          >
            “
          </span>
          <blockquote className="mt-6">
            <p className="max-w-4xl text-pretty font-display text-[clamp(2.25rem,4vw,3.75rem)] leading-[1.05] tracking-[-0.02em]">
              {testimonials[0].quote}
            </p>
            <footer className="mt-10 max-w-4xl border-t border-border pt-5">
              <cite className="not-italic text-sm font-semibold">{testimonials[0].name}</cite>
              <span className="text-sm text-muted-foreground"> · {testimonials[0].role}</span>
            </footer>
          </blockquote>
        </Reveal>

        <RevealGroup className="mt-16 grid gap-10 md:grid-cols-2">
          {testimonials.slice(1).map((testimonial) => (
            <RevealItem key={testimonial.name}>
              <blockquote className="border-t border-border pt-8">
                <p className="max-w-[30ch] text-pretty font-display text-2xl leading-snug">
                  {testimonial.quote}
                </p>
                <footer className="mt-6">
                  <cite className="not-italic text-sm font-semibold">{testimonial.name}</cite>
                  <span className="text-sm text-muted-foreground"> · {testimonial.role}</span>
                </footer>
              </blockquote>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

function TrustBand() {
  const items = [
    {
      title: "Operação com rastreabilidade",
      body: "Dados, atividades e responsabilidades visíveis no mesmo fluxo.",
    },
    {
      title: "Parcerias com contexto",
      body: "Termos, imóvel e comissão reunidos antes da decisão.",
    },
    {
      title: "Receita com leitura clara",
      body: "VGV, comissão e recorrência apresentados com período e unidade.",
    },
  ];

  return (
    <section className="border-y border-white/10 px-4 py-14 sm:px-6">
      <Reveal>
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(220px,0.55fr)_minmax(0,1.45fr)] lg:gap-16">
          <h2 className="max-w-[16ch] text-balance font-display text-2xl leading-tight">
            Estrutura que sustenta decisões de alto valor.
          </h2>
          <div className="border-b border-white/15">
            {items.map((item) => (
              <div
                key={item.title}
                className="grid gap-1 border-t border-white/15 py-4 sm:grid-cols-[220px_1fr] sm:gap-6"
              >
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <p className="text-sm leading-6 text-white/65">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function FinalCTA() {
  return (
    <section id="contato" className="scroll-mt-[72px] px-4 py-24 sm:px-6 md:py-32">
      <div className="mx-auto max-w-5xl">
        <Eyebrow n="06" label="Comece com controle" center className="mb-14" />
        <RevealGroup className="text-center">
          <RevealItem>
            <h2 className="mx-auto max-w-[13ch] text-balance font-display text-[clamp(3rem,6vw,5.75rem)] leading-[0.96] tracking-[-0.02em]">
              Seu próximo negócio pode começar com mais controle.
            </h2>
          </RevealItem>
          <RevealItem>
            <p className="mx-auto mt-7 max-w-2xl text-pretty text-base leading-7 text-white/75 sm:text-lg">
              Conheça a plataforma com alguém do time Ubroker ou acesse sua conta para continuar
              sua operação.
            </p>
          </RevealItem>
          <RevealItem>
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
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition-[colors,transform] duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/5 motion-reduce:transform-none ${focusRing}`}
              >
                Entrar na plataforma
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </RevealItem>
        </RevealGroup>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 py-14 text-sm text-white/60 sm:px-6">
      <Reveal>
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
      </Reveal>
    </footer>
  );
}
