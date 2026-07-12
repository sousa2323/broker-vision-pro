import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Plus,
  Sparkles,
  MessageSquare,
  Users,
  Zap,
  Shield,
  TrendingUp,
} from "lucide-react";
import { UbrokerLogo } from "@/components/ubroker-logo";

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
    <div className="min-h-screen bg-navy text-navy-foreground">
      <Header />
      <Hero />
      <StatsBand />
      <ValueCards />
      <ProductShowcase />
      <Differentials />
      <Testimonials />
      <PressBand />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-navy/85 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="text-navy-foreground">
          <UbrokerLogo />
        </Link>
        <nav className="hidden items-center gap-10 text-sm text-white/70 md:flex">
          <a href="#plataforma" className="hover:text-white">
            A plataforma
          </a>
          <a href="#solucoes" className="hover:text-white">
            Soluções
          </a>
          <a href="#parcerias" className="hover:text-white">
            Parcerias
          </a>
          <a href="#imprensa" className="hover:text-white">
            Imprensa
          </a>
        </nav>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm text-white/70 transition hover:text-white">
            Entrar
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pb-24 pt-20 md:grid-cols-2 md:pt-28">
        <div className="flex flex-col justify-center">
          <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-widest text-white/70">
            <Sparkles className="h-3.5 w-3.5 text-warm" /> Plataforma 2026
          </span>
          <h1 className="font-display text-[clamp(3rem,7vw,6.5rem)] leading-[0.95] tracking-tight">
            Corretores
            <br />
            no controle.
          </h1>
          <p className="mt-8 max-w-lg text-lg leading-relaxed text-white/70">
            A Ubroker dá ao corretor de alto padrão tudo que ele precisa em um único lugar: leads,
            pipeline, IA, omnichannel, parcerias e monetização SaaS — sem depender da imobiliária.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#plataforma"
              className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
            >
              Falar com vendas <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div className="relative">
          <div
            className="aspect-[4/5] w-full overflow-hidden bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80')",
              clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0 100%, 0 18%)",
            }}
          />
          <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-white/10 bg-navy/90 p-5 backdrop-blur md:block">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-warm text-warm-foreground">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="num text-2xl font-semibold">+R$ 3,5 bi</div>
                <div className="text-xs text-white/60">VGV transacionado pela rede</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBand() {
  const stats = [
    { v: "+R$ 3,5 bi", l: "VGV transacionado" },
    { v: "+39 mil", l: "Imóveis centralizados" },
    { v: "+750", l: "Corretores na rede" },
    { v: "4 cidades", l: "SP · RJ · CWB · POA" },
  ];
  return (
    <section id="plataforma" className="border-y border-white/10 bg-navy/60">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-y divide-white/10 md:grid-cols-4 md:divide-x md:divide-y-0">
        {stats.map((s, i) => (
          <div key={i} className="px-6 py-12 text-center md:py-16">
            <div className="font-display text-[clamp(2rem,4vw,3.5rem)] leading-none">{s.v}</div>
            <div className="mt-3 text-xs uppercase tracking-widest text-white/50">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ValueCards() {
  const cards = [
    {
      title: "Construímos sua marca",
      body: "Site profissional, presença omnichannel e identidade visual de alto padrão para o corretor.",
    },
    {
      title: "Potencializamos seus ganhos",
      body: "Comissões compartilhadas em rede, recorrência SaaS por indicação e isenção de mensalidade.",
    },
    {
      title: "Aumentamos sua produtividade",
      body: "Leads, pipeline, agenda, IA e omnichannel em um único painel.",
      highlight: true,
    },
    {
      title: "Reduzimos seu risco",
      body: "Carteira diversificada via parcerias, contratos jurídicos prontos, suporte completo.",
    },
  ];
  return (
    <section id="solucoes" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
          <div>
            <h2 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95]">
              Trabalhe para
              <br />
              você sem precisar
              <br />
              trabalhar sozinho.
            </h2>
          </div>
          <div className="flex items-end">
            <p className="max-w-md text-white/70">
              Cresça seu negócio com produtos e serviços especialmente pensados para corretores de
              alta produtividade.
              <br />
              <br />
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-full bg-warm px-6 py-3 text-sm text-warm-foreground hover:brightness-110"
              >
                Saiba mais
              </a>
            </p>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <div
              key={i}
              className={`group relative flex h-72 flex-col justify-between p-7 transition ${
                c.highlight
                  ? "bg-white text-ink"
                  : "bg-navy text-white hover:bg-white hover:text-ink"
              }`}
            >
              <div className="font-display text-2xl leading-tight">{c.title}</div>
              <div className="space-y-4">
                <p className="text-sm leading-relaxed opacity-80">{c.body}</p>
                <div className="grid h-9 w-9 place-items-center rounded-full bg-warm text-warm-foreground">
                  <Plus className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductShowcase() {
  return (
    <section className="bg-surface px-6 py-24 text-ink md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 max-w-2xl">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">O painel</span>
          <h2 className="mt-4 font-display text-[clamp(2.25rem,4.5vw,4rem)] leading-[1] tracking-tight">
            Painel do corretor.
            <br />
            Dados em tempo real.
          </h2>
          <p className="mt-6 max-w-lg text-muted-foreground">
            Tudo que você precisa para fechar mais negócios, sem alternar entre 7 ferramentas
            diferentes.
          </p>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border bg-surface px-5 py-3">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-amber-400" />
            <div className="h-3 w-3 rounded-full bg-emerald-400" />
            <div className="ml-4 text-xs text-muted-foreground">app.ubroker.com.br/dashboard</div>
          </div>
          <div className="grid grid-cols-12 gap-6 p-8">
            <div className="col-span-12 grid grid-cols-2 gap-4 md:col-span-8 md:grid-cols-4">
              {[
                { l: "VGV", v: "R$ 3,2 mi" },
                { l: "Faturamento", v: "R$ 96 k" },
                { l: "Ticket médio", v: "R$ 800 k" },
                { l: "Vendidos", v: "2 / mês" },
              ].map((k, i) => (
                <div key={i} className="rounded-xl border border-border p-5">
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    {k.l}
                  </div>
                  <div className="mt-2 num font-display text-2xl">{k.v}</div>
                </div>
              ))}
              <div className="col-span-2 rounded-xl border border-border p-6 md:col-span-4">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Evolução de vendas
                </div>
                <svg viewBox="0 0 400 100" className="mt-4 h-32 w-full">
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
            <div className="col-span-12 space-y-4 md:col-span-4">
              <div className="rounded-xl bg-navy p-6 text-navy-foreground">
                <div className="text-xs uppercase tracking-widest text-white/50">
                  Monetização SaaS
                </div>
                <div className="mt-3 num font-display text-3xl">R$ 480</div>
                <div className="mt-2 text-sm text-white/70">
                  Faltam R$ 120 para isentar sua mensalidade
                </div>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                  <div className="h-full w-[80%] bg-warm" />
                </div>
              </div>
              <div className="rounded-xl border border-border p-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Operação
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {[
                    { n: 18, l: "Novos" },
                    { n: 12, l: "Atend." },
                    { n: 5, l: "Propostas" },
                  ].map((o, i) => (
                    <div key={i}>
                      <div className="num font-display text-xl">{o.n}</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {o.l}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
      body: "Toda a jornada do cliente — do primeiro toque ao fechamento — em um único lugar, com automações inteligentes.",
    },
    {
      icon: MessageSquare,
      title: "IA + omnichannel nativos",
      body: "Assistente de IA atende WhatsApp, Instagram e portais, qualifica leads e devolve qualificados prontos para você fechar.",
    },
    {
      icon: Users,
      title: "Rede de parcerias com comissão compartilhada",
      body: "Acesse o inventário de +750 corretores. Solicite parceria com 1 clique. Sem feed, sem ruído — só negócio.",
    },
  ];
  return (
    <section id="parcerias" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 max-w-3xl">
          <span className="text-xs uppercase tracking-widest text-white/50">Por que Ubroker</span>
          <h2 className="mt-4 font-display text-[clamp(2.25rem,4.5vw,4rem)] leading-[1]">
            Três frentes que mudam
            <br />a vida do corretor.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/10 md:grid-cols-3">
          {items.map((it, i) => (
            <div key={i} className="bg-navy p-10">
              <it.icon className="h-8 w-8 text-warm" strokeWidth={1.5} />
              <h3 className="mt-8 font-display text-2xl leading-tight">{it.title}</h3>
              <p className="mt-4 text-sm text-white/70">{it.body}</p>
              <div className="mt-8 flex items-center gap-2 text-sm text-white/60">
                <Check className="h-4 w-4 text-warm" /> Disponível no plano Free
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const t = [
    {
      name: "Alessandra Freixo",
      role: "Olhar de Corretora · Niterói",
      photo: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&q=80",
      quote:
        "Em 4 meses dobrei meu pipeline qualificado. A IA da Ubroker virou minha sócia silenciosa.",
    },
    {
      name: "Aldemar e Thiago",
      role: "Homesphere · Maricá",
      photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80",
      quote:
        "Fechamos 3 vendas em parceria via Ubroker no primeiro mês. A rede funciona de verdade.",
    },
    {
      name: "Denise Molinaro",
      role: "Denise no Jardins · São Paulo",
      photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80",
      quote:
        "Indicar clientes que estão saindo de SP virou receita recorrente. A monetização SaaS é genial.",
    },
  ];
  return (
    <section className="bg-surface px-6 py-24 text-ink md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex items-end justify-between">
          <h2 className="font-display text-[clamp(2.25rem,4.5vw,4rem)] leading-[1] tracking-tight">
            O que nossos
            <br />
            parceiros têm a dizer
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {t.map((p, i) => (
            <article key={i} className="group flex flex-col bg-card">
              <img src={p.photo} alt={p.name} className="aspect-[4/5] w-full object-cover" />
              <div className="bg-navy p-6 text-navy-foreground">
                <p className="text-sm leading-relaxed text-white/85">"{p.quote}"</p>
                <div className="mt-6 border-t border-white/10 pt-4">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-white/60">{p.role}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PressBand() {
  const press = ["Valor", "Exame", "InfoMoney", "NeoFeed"];
  return (
    <section id="imprensa" className="border-y border-white/10 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-xs uppercase tracking-widest text-white/50">Na imprensa</div>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {press.map((p, i) => (
            <div key={i} className="border-l border-white/10 pl-6">
              <div className="font-display text-3xl text-white/90">{p}</div>
              <p className="mt-3 text-xs text-white/55">
                "Ubroker reorganiza o mercado de corretagem de alto padrão com tecnologia e rede
                colaborativa."
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="px-6 py-32">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="font-display text-[clamp(3rem,7vw,7rem)] leading-[0.92]">
          Pronto para subir
          <br />
          de nível?
        </h2>
        <p className="mx-auto mt-8 max-w-xl text-white/70">
          Veja a plataforma completa em ação. Sem cadastro, sem cartão — entre direto no painel
          demo.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy/80 px-6 py-16 text-sm text-white/60">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 md:grid-cols-5">
        <div className="col-span-2">
          <UbrokerLogo />
          <p className="mt-4 max-w-xs">A plataforma de corretagem para o alto padrão brasileiro.</p>
          <div className="mt-6 text-xs text-white/40">contato@ubroker.com.br</div>
        </div>
        {[
          { t: "Plataforma", l: ["Dashboard", "Leads", "Pipeline", "Imóveis"] },
          { t: "Rede", l: ["Parcerias", "Indicações", "Marketplace"] },
          { t: "Empresa", l: ["Sobre", "Imprensa", "Carreiras", "Contato"] },
        ].map((c, i) => (
          <div key={i}>
            <div className="mb-4 text-xs uppercase tracking-widest text-white/40">{c.t}</div>
            <ul className="space-y-2">
              {c.l.map((x) => (
                <li key={x}>
                  <a href="#" className="hover:text-white">
                    {x}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl items-center justify-between border-t border-white/10 pt-8 text-xs text-white/40">
        <div>© 2026 Ubroker. Todos os direitos reservados.</div>
        <div className="flex items-center gap-4">
          <Link to="/admin" className="hover:text-white/70">
            Admin (demo)
          </Link>
          <span className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" /> CRECI Conformidade
          </span>
        </div>
      </div>
    </footer>
  );
}
