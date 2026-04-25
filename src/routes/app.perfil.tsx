import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Award } from "lucide-react";
import { broker } from "@/data/mock";

export const Route = createFileRoute("/app/perfil")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-1">
        <img src={broker.avatar} alt={broker.name} className="mx-auto h-32 w-32 rounded-full object-cover ring-4 ring-surface" />
        <div className="mt-4 text-center">
          <div className="font-display text-2xl">{broker.name}</div>
          <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs">
            <Award className="h-3.5 w-3.5 text-warm" /> Plano {broker.plan}
          </div>
        </div>
        <button className="mt-6 w-full rounded-md bg-navy px-3 py-2 text-sm text-navy-foreground">
          Fazer upgrade para Pro
        </button>
      </div>

      <div className="space-y-4 lg:col-span-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Informações</div>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field icon={Mail} label="E-mail" value={broker.email} />
            <Field icon={Phone} label="Telefone" value={broker.phone} />
            <Field icon={MapPin} label="Região de atuação" value={broker.region} />
            <Field icon={Award} label="CRECI" value={broker.creci} />
          </dl>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Bio pública</div>
          <textarea
            defaultValue="Corretor com 8 anos de experiência no alto padrão de Niterói. Especialista em coberturas e casas de praia. Atendimento concierge para famílias mudando do RJ e SP."
            className="mt-3 w-full resize-none rounded-md border border-border bg-background p-3 text-sm"
            rows={4}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button className="rounded-md border border-border px-4 py-2 text-sm">Cancelar</button>
          <button className="rounded-md bg-navy px-4 py-2 text-sm text-navy-foreground">Salvar alterações</button>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon, label, value,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-surface p-4">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}
