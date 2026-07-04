import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { UbrokerLogo } from "@/components/ubroker-logo";

/**
 * Layout compartilhado de /login e /cadastro: painel navy à esquerda
 * (branding, escondido no mobile) e conteúdo do formulário à direita.
 */
export function AuthShell({
  headline,
  subline,
  children,
}: {
  headline: React.ReactNode;
  subline: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-navy text-navy-foreground">
      {/* Painel de branding */}
      <aside className="relative hidden w-[42%] shrink-0 flex-col justify-between overflow-hidden p-10 lg:flex">
        <Link to="/" className="text-navy-foreground">
          <UbrokerLogo />
        </Link>

        <div>
          <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-widest text-white/70">
            <Sparkles className="h-3.5 w-3.5 text-warm" /> Plataforma 2026
          </span>
          <h1 className="font-display text-[clamp(2.5rem,4vw,4rem)] leading-[1.02] tracking-tight">
            {headline}
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/70">{subline}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-sm">
          <div>
            <div className="num text-xl font-semibold">+R$ 3,5 bi</div>
            <div className="mt-0.5 text-xs text-white/60">VGV transacionado</div>
          </div>
          <div>
            <div className="num text-xl font-semibold">+39 mil</div>
            <div className="mt-0.5 text-xs text-white/60">Imóveis centralizados</div>
          </div>
          <div>
            <div className="num text-xl font-semibold">+750</div>
            <div className="mt-0.5 text-xs text-white/60">Corretores na rede</div>
          </div>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-surface text-ink">
        <div className="flex items-center justify-between px-6 py-5 lg:hidden">
          <Link to="/" className="text-ink">
            <UbrokerLogo />
          </Link>
        </div>
        <div className="flex flex-1 items-start justify-center px-6 py-8 lg:items-center lg:py-12">
          <div className="w-full max-w-xl">{children}</div>
        </div>
      </main>
    </div>
  );
}
