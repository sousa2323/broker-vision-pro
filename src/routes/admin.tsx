import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wallet,
  UserPlus,
  Users,
  Building2,
  Filter,
  Handshake,
  Sparkles,
  Inbox,
  Settings,
  FileSearch,
  ShieldAlert,
  Search,
  Bell,
} from "lucide-react";
import { UbrokerLogo } from "@/components/ubroker-logo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  exact?: boolean;
  badge?: number;
};
type NavGroup = { title: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    title: "Operação",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/admin/financeiro", label: "Financeiro", icon: Wallet, badge: 3 },
      { to: "/admin/indicacoes", label: "Indicações", icon: UserPlus },
    ],
  },
  {
    title: "Rede",
    items: [
      { to: "/admin/usuarios", label: "Usuários", icon: Users },
      { to: "/admin/imoveis", label: "Imóveis", icon: Building2 },
      { to: "/admin/leads", label: "Leads", icon: Filter },
      { to: "/admin/parcerias", label: "Parcerias", icon: Handshake },
    ],
  },
  {
    title: "Inteligência",
    items: [
      { to: "/admin/ia", label: "IA Assistente", icon: Sparkles },
      { to: "/admin/inbox", label: "Inbox", icon: Inbox },
    ],
  },
  {
    title: "Governança",
    items: [
      { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
      { to: "/admin/auditoria", label: "Auditoria", icon: FileSearch },
      { to: "/admin/suporte", label: "Suporte / Disputas", icon: ShieldAlert, badge: 2 },
    ],
  },
];

function AdminLayout() {
  const loc = useLocation();
  const current = groups
    .flatMap((g) => g.items)
    .find((i) => (i.exact ? loc.pathname === i.to : loc.pathname.startsWith(i.to)));

  return (
    <div className="flex min-h-screen bg-surface text-ink">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-6 py-6">
          <Link to="/" className="flex items-center gap-2 text-white">
            <UbrokerLogo />
            <span className="rounded bg-warm px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-warm-foreground">
              Admin
            </span>
          </Link>
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
                        to={it.to as string}
                        className={cn(
                          "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                          active
                            ? "bg-sidebar-accent-active text-white"
                            : "text-white/70 hover:bg-sidebar-accent hover:text-white",
                        )}
                      >
                        <it.icon className="h-4 w-4" strokeWidth={1.75} />
                        <span className="flex-1">{it.label}</span>
                        {it.badge ? (
                          <span className="rounded-full bg-warm px-1.5 py-0.5 text-[10px] font-semibold text-warm-foreground">
                            {it.badge}
                          </span>
                        ) : null}
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
            <div className="grid h-9 w-9 place-items-center rounded-full bg-warm text-warm-foreground text-sm font-semibold">
              SA
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm text-white">Superadmin Ubroker</div>
              <div className="text-xs text-white/50">Acesso total</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                Ubroker
                <span className="rounded bg-warm/15 px-1.5 py-0.5 text-[9px] font-semibold text-warm">
                  Admin
                </span>
              </div>
              <div className="font-display text-lg leading-none">
                {current?.label ?? "Dashboard"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground md:flex">
              <Search className="h-4 w-4" />
              <span>Buscar corretor, venda, cobrança…</span>
            </div>
            <button className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
            </button>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-navy text-white text-xs font-semibold ring-1 ring-border">
              SA
            </div>
          </div>
        </header>
        <main className="flex-1 px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
