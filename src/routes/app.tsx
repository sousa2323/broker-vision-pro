import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Kanban,
  Building2,
  Handshake,
  ListChecks,
  Sparkles,
  Inbox,
  Wallet,
  UserPlus,
  User,
  Settings,
  Bell,
  Search,
  LogOut,
  ChevronRight,
  Home,
} from "lucide-react";
import { UbrokerLogo } from "@/components/ubroker-logo";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";
import { useBrokerProfile, type BrokerProfile } from "@/lib/auth";
import { useActivities } from "@/lib/activities";
import { useDirectory } from "@/lib/directory";
import { useLeads } from "@/lib/leads";
import { useProperties } from "@/lib/properties";
import { cn } from "@/lib/utils";

/** Iniciais (até 2) a partir do nome completo, para o fallback do avatar. */
function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Avatar do corretor logado. Enquanto o perfil carrega (`profile === null`),
 * mostra um ícone neutro — nunca a foto/nome fictício do mock. Com perfil,
 * usa a foto real e cai nas iniciais quando não há `avatar_url`.
 */
function UserAvatar({
  profile,
  className,
  fallbackClassName,
}: {
  profile: BrokerProfile | null;
  className?: string;
  fallbackClassName?: string;
}) {
  return (
    <Avatar className={className}>
      {profile?.avatar_url ? (
        <AvatarImage src={profile.avatar_url} alt="" className="object-cover" />
      ) : null}
      <AvatarFallback className={fallbackClassName}>
        {profile ? (
          <span className="text-xs font-medium">{initials(profile.full_name)}</span>
        ) : (
          <User className="h-4 w-4" />
        )}
      </AvatarFallback>
    </Avatar>
  );
}

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return; // SSR: sessão vive em localStorage, o client revalida
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: AppLayout,
});

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  exact?: boolean;
};
type NavGroup = { title: string; items: NavItem[] };

const groups: NavGroup[] = [
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
];

type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  kind: "lead" | "property" | "broker" | "route";
  route: string;
  icon: ComponentType<{ className?: string }>;
};

type NotificationItem = {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  tone: "urgent" | "info" | "success";
};

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function SearchControl({
  results,
  onGo,
}: {
  results: SearchResult[];
  onGo: (item: SearchResult) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden min-w-[280px] items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-left text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground md:flex lg:min-w-[340px]"
      >
        <Search className="h-4 w-4" />
        <span className="min-w-0 flex-1 truncate">Buscar leads, imóveis, corretores...</span>
        <kbd className="ml-3 rounded bg-muted px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-foreground md:hidden"
        aria-label="Buscar"
      >
        <Search className="h-4 w-4" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar leads, imóveis, corretores..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Resultados">
            {results.map((item) => (
              <CommandItem
                key={`${item.kind}-${item.id}`}
                value={`${item.title} ${item.subtitle} ${item.kind}`}
                onSelect={() => {
                  setOpen(false);
                  onGo(item);
                }}
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{item.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

function NotificationBell({
  items,
  onGo,
}: {
  items: NotificationItem[];
  onGo: (route: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-foreground"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
          {items.length > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {items.length > 9 ? "9+" : items.length}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,360px)] p-0">
        <div className="border-b border-border px-4 py-3">
          <div className="font-medium">Notificações</div>
          <div className="text-xs text-muted-foreground">
            Alertas importantes do seu fluxo comercial.
          </div>
        </div>
        <div className="max-h-[360px] overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              Tudo em dia por aqui.
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onGo(item.route)}
                className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition hover:bg-muted"
              >
                <span
                  className={cn(
                    "mt-1 h-2 w-2 rounded-full",
                    item.tone === "urgent" && "bg-destructive",
                    item.tone === "info" && "bg-primary",
                    item.tone === "success" && "bg-emerald-500",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{item.title}</span>
                  <span className="block text-xs text-muted-foreground">{item.subtitle}</span>
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function UserMenu({
  profile,
  displayName,
  displayPlan,
  onGo,
  onLogout,
}: {
  profile: BrokerProfile | null;
  displayName: string;
  displayPlan: string;
  onGo: (route: string) => void;
  onLogout: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <UserAvatar
            profile={profile}
            className="h-9 w-9 ring-1 ring-border"
            fallbackClassName="bg-muted text-muted-foreground"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <UserAvatar
              profile={profile}
              className="h-10 w-10"
              fallbackClassName="bg-muted text-muted-foreground"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{displayName}</div>
              <div className="text-xs font-normal text-muted-foreground">Plano {displayPlan}</div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onGo("/app/perfil")}>
          <User className="h-4 w-4" />
          Perfil do corretor
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onGo("/app/configuracoes")}>
          <Settings className="h-4 w-4" />
          Configurações
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onLogout} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const profile = useBrokerProfile();
  const { leads } = useLeads();
  const { properties } = useProperties();
  const { brokers } = useDirectory();
  const { activities } = useActivities();
  const current = groups
    .flatMap((g) => g.items)
    .find((i) => (i.exact ? loc.pathname === i.to : loc.pathname.startsWith(i.to)));

  // Perfil real com fallback no mock (protótipo) enquanto carrega / para campos vazios
  const displayName = profile?.full_name ?? "Corretor";
  const displayPlan = profile?.plan ?? "Free";

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  function goToRoute(route: string) {
    navigate({ to: route as never });
  }

  function handleSearchGo(item: SearchResult) {
    if (item.kind === "property") {
      navigate({ to: "/app/imoveis/$id", params: { id: item.id } });
      return;
    }
    if (item.kind === "broker") {
      navigate({ to: "/app/parcerias/$id", params: { id: item.id } });
      return;
    }
    goToRoute(item.route);
  }

  const searchResults = useMemo<SearchResult[]>(() => {
    const routeResults = groups.flatMap((group) =>
      group.items.map((item) => ({
        id: item.to,
        title: item.label,
        subtitle: `Abrir ${item.label}`,
        kind: "route" as const,
        route: item.to,
        icon: item.icon,
      })),
    );

    const leadResults = leads.slice(0, 12).map((lead) => ({
      id: lead.id,
      title: lead.nome,
      subtitle: `Lead · ${lead.status} · ${lead.interesse || lead.telefone || "Sem detalhe"}`,
      kind: "lead" as const,
      route: "/app/leads",
      icon: Users,
    }));

    const propertyResults = properties.slice(0, 12).map((property) => ({
      id: property.id,
      title: property.nome,
      subtitle: `Imóvel · ${property.cidade || property.bairro || property.status}`,
      kind: "property" as const,
      route: "/app/imoveis",
      icon: Home,
    }));

    const brokerResults = brokers.slice(0, 12).map((broker) => ({
      id: broker.id,
      title: broker.full_name,
      subtitle: `Corretor · ${broker.regions?.[0] ?? broker.ticket_range ?? "Diretório"}`,
      kind: "broker" as const,
      route: "/app/parcerias",
      icon: Handshake,
    }));

    return [...routeResults, ...leadResults, ...propertyResults, ...brokerResults];
  }, [brokers, leads, properties]);

  const notifications = useMemo<NotificationItem[]>(() => {
    const now = new Date();
    const pendingActivities = activities.filter((activity) => !activity.done);
    const overdue = pendingActivities.filter((activity) => new Date(activity.scheduledAt) < now);
    const today = pendingActivities.filter((activity) =>
      sameDay(new Date(activity.scheduledAt), now),
    );
    const newLeads = leads.filter((lead) => lead.status === "Novo");
    const negotiating = properties.filter((property) => property.status === "Em negociação");

    return [
      ...overdue.slice(0, 3).map((activity) => ({
        id: `overdue-${activity.id}`,
        title: `${activity.tipo} atrasada`,
        subtitle: `${activity.cliente} · ${activity.data} às ${activity.hora}`,
        route: "/app/atividades",
        tone: "urgent" as const,
      })),
      ...today.slice(0, 3).map((activity) => ({
        id: `today-${activity.id}`,
        title: `${activity.tipo} hoje`,
        subtitle: `${activity.cliente} · ${activity.hora}`,
        route: "/app/atividades",
        tone: "info" as const,
      })),
      ...(newLeads.length
        ? [
            {
              id: "new-leads",
              title: `${newLeads.length} lead${newLeads.length > 1 ? "s" : ""} novo${newLeads.length > 1 ? "s" : ""}`,
              subtitle: "Revise os contatos ainda não qualificados.",
              route: "/app/leads",
              tone: "success" as const,
            },
          ]
        : []),
      ...(negotiating.length
        ? [
            {
              id: "negotiating-properties",
              title: `${negotiating.length} imóvel${negotiating.length > 1 ? "is" : ""} em negociação`,
              subtitle: "Acompanhe oportunidades abertas.",
              route: "/app/imoveis",
              tone: "info" as const,
            },
          ]
        : []),
    ].slice(0, 8);
  }, [activities, leads, properties]);

  return (
    <div className="flex min-h-screen bg-surface text-ink">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-6 py-6">
          <Link to="/" className="text-white">
            <UbrokerLogo />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-6 sidebar-scroll">
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
            <UserAvatar
              profile={profile}
              className="h-9 w-9"
              fallbackClassName="bg-sidebar-accent text-white/80"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-white">{displayName}</div>
              <div className="text-xs text-white/50">Plano {displayPlan}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sair"
              aria-label="Sair"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-white/50 transition hover:bg-sidebar-accent hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
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
            <SearchControl results={searchResults} onGo={handleSearchGo} />
            <NotificationBell items={notifications} onGo={goToRoute} />
            <UserMenu
              profile={profile}
              displayName={displayName}
              displayPlan={displayPlan}
              onGo={goToRoute}
              onLogout={handleLogout}
            />
          </div>
        </header>
        <main className="flex-1 px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
