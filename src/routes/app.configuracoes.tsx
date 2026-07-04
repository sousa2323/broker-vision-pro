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
import { broker } from "@/data/mock";
import { useBrokerProfile } from "@/lib/auth";

export const Route = createFileRoute("/app/configuracoes")({
  component: SettingsPage,
});

function SettingsPage() {
  const profile = useBrokerProfile();
  const [s, setS] = useState({
    // Notificações - Leads
    leadsEmail: true,
    leadsPush: true,
    // Notificações - Parcerias
    parceriasConvites: false,
    propostasUpdates: true,
    parceriaFechada: true,
    // Notificações - Performance
    digest: false,
    insightsIA: true,
    // Automações
    autoAtividade: true,
    autoFollowup: true,
    autoSugestoes: false,
    autoLembretePipeline: true,
    // Privacidade
    perfilVisivel: true,
    aceitaParcerias: true,
    exibeImoveisRede: true,
    // Aparência
    dark: false,
  });

  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));
  const toggle = (k: keyof typeof s) => set(k, !s[k] as never);

  const [idioma, setIdioma] = useState("pt-br");
  const [fuso, setFuso] = useState("gmt-3");
  const [moeda, setMoeda] = useState("brl");
  const [densidade, setDensidade] = useState<"compacto" | "confortavel">("confortavel");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Controle como o sistema trabalha por você.
        </p>
      </div>

      {/* NOTIFICAÇÕES */}
      <Section icon={Bell} title="Notificações" desc="Como queremos te avisar.">
        <p className="pb-3 text-xs text-muted-foreground">
          Escolha quando e como deseja ser avisado sobre oportunidades e atividades importantes.
        </p>

        <SubGroup label="Leads">
          <Toggle
            label="Novo lead por e-mail"
            v={s.leadsEmail}
            onChange={() => toggle("leadsEmail")}
          />
          <Toggle
            label="Novo lead via push (mobile)"
            v={s.leadsPush}
            onChange={() => toggle("leadsPush")}
          />
        </SubGroup>

        <SubGroup label="Parcerias">
          <Toggle
            label="Convites de parceria"
            v={s.parceriasConvites}
            onChange={() => toggle("parceriasConvites")}
          />
          <Toggle
            label="Atualizações de proposta"
            v={s.propostasUpdates}
            onChange={() => toggle("propostasUpdates")}
          />
          <Toggle
            label="Parceria fechada"
            v={s.parceriaFechada}
            onChange={() => toggle("parceriaFechada")}
          />
        </SubGroup>

        <SubGroup label="Performance">
          <Toggle label="Resumo diário (18h)" v={s.digest} onChange={() => toggle("digest")} />
          <Toggle
            label="Insights semanais da IA"
            v={s.insightsIA}
            onChange={() => toggle("insightsIA")}
          />
        </SubGroup>
      </Section>

      {/* AUTOMAÇÕES */}
      <Section icon={Zap} title="Automação de processos" desc="Deixe o sistema trabalhar por você.">
        <Toggle
          label="Criar atividade automática ao receber lead"
          v={s.autoAtividade}
          onChange={() => toggle("autoAtividade")}
        />
        <Toggle
          label="Criar follow-up automático após 24h sem resposta"
          v={s.autoFollowup}
          onChange={() => toggle("autoFollowup")}
        />
        <Toggle
          label="Sugerir imóveis automaticamente via IA"
          v={s.autoSugestoes}
          onChange={() => toggle("autoSugestoes")}
        />
        <Toggle
          label="Lembrar de atualizar etapa do pipeline"
          v={s.autoLembretePipeline}
          onChange={() => toggle("autoLembretePipeline")}
        />
      </Section>

      {/* PRIVACIDADE */}
      <Section
        icon={Eye}
        title="Privacidade e visibilidade"
        desc="Controle sua participação no ecossistema."
      >
        <Toggle
          label="Tornar meu perfil visível para outros corretores"
          v={s.perfilVisivel}
          onChange={() => toggle("perfilVisivel")}
        />
        <Toggle
          label="Permitir receber solicitações de parceria"
          v={s.aceitaParcerias}
          onChange={() => toggle("aceitaParcerias")}
        />
        <Toggle
          label="Exibir meus imóveis para a rede"
          v={s.exibeImoveisRede}
          onChange={() => toggle("exibeImoveisRede")}
        />
      </Section>

      {/* PREFERÊNCIAS */}
      <Section icon={Globe} title="Preferências" desc="Idioma, fuso horário e moeda.">
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
      </Section>

      {/* APARÊNCIA */}
      <Section icon={Moon} title="Aparência" desc="Personalize a interface.">
        <Toggle label="Modo escuro" v={s.dark} onChange={() => toggle("dark")} />
        <div className="flex items-center justify-between py-3 text-sm">
          <span>Densidade da interface</span>
          <div className="flex gap-1.5">
            {(["compacto", "confortavel"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDensidade(d)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs capitalize transition-colors",
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
      </Section>

      {/* PLANO E COBRANÇA */}
      <Section
        icon={CreditCard}
        title="Plano e cobrança"
        desc="Gerencie seu plano e recursos ativos."
      >
        <Pref label="Plano atual" value={profile?.plan ?? broker.plan} />
        <Pref
          label="Valor mensal"
          value={(profile?.plan ?? broker.plan) === "Pro" ? "R$ 149/mês" : "R$ 0/mês"}
        />
        <Pref label="Próxima cobrança" value="—" />
        <div className="flex items-center justify-between py-3 text-sm">
          <span className="text-muted-foreground">Recursos ativos</span>
          <div className="flex flex-wrap justify-end gap-1.5">
            {["IA Assistente", "Inbox", "Indicações"].map((r) => (
              <span key={r} className="rounded-full bg-surface px-2.5 py-1 text-xs">
                {r}
              </span>
            ))}
          </div>
        </div>
        <div className="flex justify-end pt-3">
          <button className="rounded-md bg-warm px-4 py-2 text-sm text-warm-foreground hover:opacity-90">
            Gerenciar plano
          </button>
        </div>
      </Section>

      {/* INTEGRAÇÕES */}
      <Section icon={Smartphone} title="Integrações" desc="Conecte seus canais.">
        <Integracao nome="WhatsApp Business" sub={profile?.phone || broker.phone} conectado />
        <Integracao nome="Instagram" sub="@ramoncapone.imoveis" conectado />
        <Integracao nome="Site / Landing page" sub="Não conectado" />
        <Integracao nome="Marketplace B2C" sub="Sincronizado" conectado />
      </Section>

      {/* SEGURANÇA */}
      <Section icon={Lock} title="Segurança" desc="Acesso e privacidade.">
        <Pref label="Autenticação 2FA" value="Ativada" />
        <Pref label="Última sessão" value="Hoje, 09:14 · Niterói" />
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-medium">{title}</h2>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function SubGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2">
      <div className="pt-2 pb-1 text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function Toggle({ label, v, onChange }: { label: string; v: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <span>{label}</span>
      <button
        onClick={onChange}
        className={cn("relative h-6 w-11 rounded-full transition", v ? "bg-navy" : "bg-border")}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
            v ? "left-[calc(100%-22px)]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

function Pref({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
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
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-56">
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
    <div className="flex items-center justify-between gap-3 py-3 text-sm">
      <div className="min-w-0">
        <div className="truncate">{nome}</div>
        <div className="truncate text-xs text-muted-foreground">{sub}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px]",
            conectado ? "bg-emerald-100 text-emerald-700" : "bg-surface text-muted-foreground",
          )}
        >
          {conectado ? "Conectado" : "—"}
        </span>
        <button className="rounded-md border border-border px-3 py-1 text-xs hover:bg-surface">
          {conectado ? "Gerenciar" : "Conectar"}
        </button>
      </div>
    </div>
  );
}
