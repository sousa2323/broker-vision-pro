import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Globe, Lock, Moon, Smartphone, Zap, Eye, CreditCard } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useBrokerProfile } from "@/lib/auth";

export const Route = createFileRoute("/app/configuracoes")({
  component: SettingsPage,
});

function SettingsPage() {
  const profile = useBrokerProfile();
  const [s, setS] = useState({
    leadsEmail: true,
    leadsPush: true,
    parceriasConvites: false,
    propostasUpdates: true,
    parceriaFechada: true,
    digest: false,
    insightsIA: true,
    autoAtividade: true,
    autoFollowup: true,
    autoSugestoes: false,
    autoLembretePipeline: true,
    perfilVisivel: true,
    aceitaParcerias: true,
    exibeImoveisRede: true,
    dark: false,
  });

  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));
  const toggle = (k: keyof typeof s) => set(k, !s[k] as never);

  const [idioma, setIdioma] = useState("pt-br");
  const [fuso, setFuso] = useState("gmt-3");
  const [moeda, setMoeda] = useState("brl");
  const [densidade, setDensidade] = useState<"compacto" | "confortavel">("confortavel");

  const alertasAtivos = [
    s.leadsEmail,
    s.leadsPush,
    s.parceriasConvites,
    s.propostasUpdates,
    s.parceriaFechada,
    s.digest,
    s.insightsIA,
  ].filter(Boolean).length;
  const automacoesAtivas = [
    s.autoAtividade,
    s.autoFollowup,
    s.autoSugestoes,
    s.autoLembretePipeline,
  ].filter(Boolean).length;
  const integracoesAtivas = [profile?.channels?.whatsapp, profile?.channels?.instagram].filter(
    Boolean,
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Central de controle
            </div>
            <h1 className="mt-2 font-display text-3xl leading-tight">Configurações</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Ajuste notificações, automações, privacidade, preferências e integrações em um painel
              mais fácil de escanear.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[560px]">
            <Metric label="Alertas" value={`${alertasAtivos}/7`} />
            <Metric label="Automações" value={`${automacoesAtivas}/4`} />
            <Metric label="Integrações" value={`${integracoesAtivas}/4`} />
            <Metric label="Plano" value={profile?.plan ?? "Free"} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="space-y-6">
          <Section icon={Bell} title="Notificações" desc="Defina como e quando quer ser avisado.">
            <div className="px-5 py-4 text-sm leading-6 text-muted-foreground">
              Receba apenas os avisos que ajudam na sua rotina comercial.
            </div>

            <SubGroup label="Leads">
              <Toggle
                label="Novo lead por e-mail"
                desc="Envia um e-mail quando um comprador entrar em contato."
                v={s.leadsEmail}
                onChange={() => toggle("leadsEmail")}
              />
              <Toggle
                label="Novo lead via push"
                desc="Notificação rápida no celular para leads novos."
                v={s.leadsPush}
                onChange={() => toggle("leadsPush")}
              />
            </SubGroup>

            <SubGroup label="Parcerias">
              <Toggle
                label="Convites de parceria"
                desc="Avise quando outro corretor solicitar colaboração."
                v={s.parceriasConvites}
                onChange={() => toggle("parceriasConvites")}
              />
              <Toggle
                label="Atualizações de proposta"
                desc="Acompanhe mudanças em propostas compartilhadas."
                v={s.propostasUpdates}
                onChange={() => toggle("propostasUpdates")}
              />
              <Toggle
                label="Parceria fechada"
                desc="Confirmações de negócios concluídos na rede."
                v={s.parceriaFechada}
                onChange={() => toggle("parceriaFechada")}
              />
            </SubGroup>

            <SubGroup label="Performance">
              <Toggle
                label="Resumo diário às 18h"
                desc="Um fechamento curto sobre leads, atividades e oportunidades."
                v={s.digest}
                onChange={() => toggle("digest")}
              />
              <Toggle
                label="Insights semanais da IA"
                desc="Sugestões para melhorar conversão, anúncios e follow-ups."
                v={s.insightsIA}
                onChange={() => toggle("insightsIA")}
              />
            </SubGroup>
          </Section>

          <Section
            icon={Zap}
            title="Automação de processos"
            desc="Tarefas repetitivas com menos atrito."
          >
            <Rows>
              <Toggle
                label="Criar atividade automática ao receber lead"
                desc="Registra a próxima ação assim que o lead chega."
                v={s.autoAtividade}
                onChange={() => toggle("autoAtividade")}
              />
              <Toggle
                label="Criar follow-up automático após 24h sem resposta"
                desc="Ajuda a não deixar conversas importantes esfriarem."
                v={s.autoFollowup}
                onChange={() => toggle("autoFollowup")}
              />
              <Toggle
                label="Sugerir imóveis automaticamente via IA"
                desc="Recomenda imóveis compatíveis com o perfil do lead."
                v={s.autoSugestoes}
                onChange={() => toggle("autoSugestoes")}
              />
              <Toggle
                label="Lembrar de atualizar etapa do pipeline"
                desc="Mantém a operação organizada sem depender de memória."
                v={s.autoLembretePipeline}
                onChange={() => toggle("autoLembretePipeline")}
              />
            </Rows>
          </Section>

          <Section
            icon={Eye}
            title="Privacidade e visibilidade"
            desc="Controle sua participação no ecossistema."
          >
            <Rows>
              <Toggle
                label="Tornar meu perfil visível para outros corretores"
                desc="Permite que outros profissionais encontrem seu perfil."
                v={s.perfilVisivel}
                onChange={() => toggle("perfilVisivel")}
              />
              <Toggle
                label="Permitir receber solicitações de parceria"
                desc="Abre seu perfil para novas oportunidades de colaboração."
                v={s.aceitaParcerias}
                onChange={() => toggle("aceitaParcerias")}
              />
              <Toggle
                label="Exibir meus imóveis para a rede"
                desc="Mostra seu inventário elegível para outros corretores."
                v={s.exibeImoveisRede}
                onChange={() => toggle("exibeImoveisRede")}
              />
            </Rows>
          </Section>
        </div>

        <div className="space-y-6">
          <Section icon={Globe} title="Preferências" desc="Idioma, fuso horário e moeda.">
            <Rows>
              <PrefSelect
                label="Idioma"
                value={idioma}
                onChange={setIdioma}
                options={[
                  { v: "pt-br", l: "Português (Brasil)" },
                  { v: "en-us", l: "English (US)" },
                  { v: "es", l: "Español" },
                ]}
              />
              <PrefSelect
                label="Fuso horário"
                value={fuso}
                onChange={setFuso}
                options={[
                  { v: "gmt-3", l: "GMT-3 · Brasília" },
                  { v: "gmt-2", l: "GMT-2 · Fernando de Noronha" },
                  { v: "gmt-0", l: "GMT+0 · Lisboa" },
                ]}
              />
              <PrefSelect
                label="Moeda"
                value={moeda}
                onChange={setMoeda}
                options={[
                  { v: "brl", l: "Real (BRL)" },
                  { v: "usd", l: "Dólar (USD)" },
                  { v: "eur", l: "Euro (EUR)" },
                ]}
              />
            </Rows>
          </Section>

          <Section icon={Moon} title="Aparência" desc="Personalize a interface.">
            <Rows>
              <Toggle
                label="Modo escuro"
                desc="Alterna a preferência visual da aplicação."
                v={s.dark}
                onChange={() => toggle("dark")}
              />
              <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium">Densidade da interface</div>
                  <div className="text-xs text-muted-foreground">
                    Escolha o espaçamento das telas.
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {(["compacto", "confortavel"] as const).map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setDensidade(d)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        densidade === d
                          ? "bg-navy text-navy-foreground"
                          : "border border-border bg-surface text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {d === "confortavel" ? "Confortável" : "Compacto"}
                    </button>
                  ))}
                </div>
              </div>
            </Rows>
          </Section>

          <Section
            icon={CreditCard}
            title="Plano e cobrança"
            desc="Gerencie seu plano e recursos ativos."
          >
            <Rows>
              <Pref label="Plano atual" value={profile?.plan ?? "Free"} />
              <Pref
                label="Valor mensal"
                value={(profile?.plan ?? "Free") === "Pro" ? "R$ 149/mês" : "R$ 0/mês"}
              />
              <Pref label="Próxima cobrança" value="—" />
              <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium text-muted-foreground">Recursos ativos</span>
                <div className="flex flex-wrap gap-1.5 sm:justify-end">
                  {["IA Assistente", "Inbox", "Indicações"].map((r) => (
                    <span key={r} className="rounded-full bg-surface px-2.5 py-1 text-xs">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </Rows>
            <div className="flex justify-end border-t border-border px-5 py-4">
              <button
                type="button"
                className="rounded-md bg-warm px-4 py-2 text-sm font-medium text-warm-foreground hover:brightness-110"
              >
                Gerenciar plano
              </button>
            </div>
          </Section>

          <Section icon={Smartphone} title="Integrações" desc="Conecte seus canais.">
            <Rows>
              <Integracao
                nome="WhatsApp Business"
                sub={profile?.channels?.whatsapp ? profile.phone || "Conectado" : "Não conectado"}
                conectado={profile?.channels?.whatsapp}
              />
              <Integracao
                nome="Instagram"
                sub={profile?.channels?.instagram ? "Conectado" : "Não conectado"}
                conectado={profile?.channels?.instagram}
              />
              <Integracao nome="Site / Landing page" sub="Não conectado" />
              <Integracao nome="Marketplace B2C" sub="Não conectado" />
            </Rows>
          </Section>

          <Section icon={Lock} title="Segurança" desc="Acesso e privacidade.">
            <Rows>
              <Pref label="Autenticação 2FA" value="Não configurada" />
              <Pref label="E-mail da conta" value={profile ? "Verificado" : "—"} />
            </Rows>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 truncate font-display text-xl text-foreground">{value}</div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  desc,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3 border-b border-border px-5 py-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{desc}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Rows({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-border px-5">{children}</div>;
}

function SubGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border px-5 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 divide-y divide-border">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  desc,
  v,
  onChange,
}: {
  label: string;
  desc?: string;
  v: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {desc ? <div className="mt-1 text-xs leading-5 text-muted-foreground">{desc}</div> : null}
      </div>
      <button
        type="button"
        aria-pressed={v}
        onClick={onChange}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition",
          v ? "bg-navy" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition",
            v ? "left-[calc(100%-22px)]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

function Pref({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function PrefSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div className="flex flex-col gap-2 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full sm:w-60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.v} value={o.v}>
              {o.l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Integracao({ nome, sub, conectado }: { nome: string; sub: string; conectado?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-4 text-sm">
      <div className="min-w-0">
        <div className="truncate font-medium">{nome}</div>
        <div className="mt-1 truncate text-xs text-muted-foreground">{sub}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-medium",
            conectado ? "bg-emerald-100 text-emerald-700" : "bg-surface text-muted-foreground",
          )}
        >
          {conectado ? "Conectado" : "—"}
        </span>
        <button
          type="button"
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-surface"
        >
          {conectado ? "Gerenciar" : "Conectar"}
        </button>
      </div>
    </div>
  );
}
