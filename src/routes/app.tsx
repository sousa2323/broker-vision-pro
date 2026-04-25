import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Kanban, Building2, Handshake, ListChecks,
  Sparkles, Inbox, Wallet, UserPlus, User, Settings, Bell, Search,
} from "lucide-react";
import { UbrokerLogo } from "@/components/ubroker-logo";
import { broker } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const groups = [
  {
    title: "Core",
    items: [
      { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/app/leads", label: "Leads", icon: Users },
      { to: "/app/pipeline", label: "Pipeline", icon: Kanban },
      { to: "/app/imoveis", label: "Imóveis", icon: Building2 },
      { to: "/app/parcerias", label: "Parcerias", icon: Handshake },
      { to: "/app/atividades", label: "Atividades", icon: ListChecks },
    ],
  },
  {
    title: "Produtividade",
    items: [
      { to: "/app/ia", label: "IA Assistente", icon: Sparkles },
      { to: "/app/inbox", label: "Inbox", icon: Inbox },
    ],
  },
  {
    title: "Monetização",
    items: [
      { to: "/app/ganhos", label: "Ganhos", icon: Wallet },
      { to: "/app/indicacoes", label: "Indicações", icon: UserPlus },
    ],
  },
  {
    title: "Suporte",
    items: [
      { to: "/app/perfil", label: "Perfil", icon: User },
      { to: "/app/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
] as const;

function AppLayout() {
  const loc = useLocation();
  const current = groups.flatMap((g) => g.items).find((i) =>
    i.exact ? loc.pathname === i.to : loc.pathname.startsWith(i.to)
  );

  return (
    <div className="flex min-h-screen bg-surface text-ink">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-6 py-6">
          <Link to="/" className="text-white"><UbrokerLogo /></Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          {groups.map((g) => (
            <div key={g.title} className="mb-6">
              <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                {g.title}
              </div>
              <ul className="space-y-0.5">
                {g.items.map((it) => {
                  const active = it.exact ? loc.pathname === it.to : loc.pathname.startsWith(it.to);
                  return (
                    <li key={it.to}>
                      <Link
                        to={it.to}
                        className={cn(
                          "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                          active
                            ? "bg-sidebar-accent-active text-white"
                            : "text-white/70 hover:bg-sidebar-accent hover:text-white"
                        )}
                      >
                        <it.icon className="h-4 w-4" strokeWidth={1.75} />
                        {it.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-3">
            <img src={broker.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
            <div className="min-w-0">
              <div className="truncate text-sm text-white">{broker.name}</div>
              <div className="text-xs text-white/50">Plano {broker.plan}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Ubroker</div>
            <div className="font-display text-lg leading-none">{current?.label ?? "Dashboard"}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground md:flex">
              <Search className="h-4 w-4" />
              <span>Buscar leads, imóveis, corretores…</span>
              <kbd className="ml-3 rounded bg-muted px-1.5 py-0.5 text-[10px]">⌘K</kbd>
            </div>
            <button className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
            </button>
            <img src={broker.avatar} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-border" />
          </div>
        </header>
        <main className="flex-1 px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
