import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Globe, Lock, Moon, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/configuracoes")({
  component: SettingsPage,
});

function SettingsPage() {
  const [s, setS] = useState({
    leadsEmail: true,
    leadsPush: true,
    propostasEmail: true,
    parceriasPush: false,
    digest: false,
    dark: false,
  });

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-2xl">Configurações</h1>

      <Section icon={Bell} title="Notificações" desc="Como queremos te avisar.">
        <Toggle label="Novo lead por e-mail" v={s.leadsEmail} onChange={() => setS({ ...s, leadsEmail: !s.leadsEmail })} />
        <Toggle label="Novo lead via push (mobile)" v={s.leadsPush} onChange={() => setS({ ...s, leadsPush: !s.leadsPush })} />
        <Toggle label="Atualizações de proposta" v={s.propostasEmail} onChange={() => setS({ ...s, propostasEmail: !s.propostasEmail })} />
        <Toggle label="Convites de parceria" v={s.parceriasPush} onChange={() => setS({ ...s, parceriasPush: !s.parceriasPush })} />
        <Toggle label="Resumo diário 18h" v={s.digest} onChange={() => setS({ ...s, digest: !s.digest })} />
      </Section>

      <Section icon={Globe} title="Preferências" desc="Idioma, fuso horário e moeda.">
        <Pref label="Idioma" value="Português (Brasil)" />
        <Pref label="Fuso horário" value="GMT-3 · Brasília" />
        <Pref label="Moeda" value="Real (BRL)" />
      </Section>

      <Section icon={Moon} title="Aparência" desc="Personalize a interface.">
        <Toggle label="Modo escuro" v={s.dark} onChange={() => setS({ ...s, dark: !s.dark })} />
      </Section>

      <Section icon={Smartphone} title="Integrações" desc="Conecte seus canais.">
        <Pref label="WhatsApp Business" value="Conectado · +55 21 99812-4477" />
        <Pref label="Instagram" value="@ramoncapone.imoveis" />
        <Pref label="Marketplace B2C" value="Sincronizado" />
      </Section>

      <Section icon={Lock} title="Segurança" desc="Acesso e privacidade.">
        <Pref label="Autenticação 2FA" value="Ativada" />
        <Pref label="Última sessão" value="Hoje, 09:14 · Niterói" />
      </Section>
    </div>
  );
}

function Section({
  icon: Icon, title, desc, children,
}: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand"><Icon className="h-5 w-5" /></div>
        <div>
          <h2 className="font-medium">{title}</h2>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function Toggle({ label, v, onChange }: { label: string; v: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <span>{label}</span>
      <button
        onClick={onChange}
        className={cn(
          "relative h-6 w-11 rounded-full transition",
          v ? "bg-navy" : "bg-border"
        )}
      >
        <span className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
          v ? "left-[calc(100%-22px)]" : "left-0.5"
        )} />
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
