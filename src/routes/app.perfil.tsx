import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, MapPin, Award, Sparkles, X, Plus } from "lucide-react";
import { broker } from "@/data/mock";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChipGroup } from "@/components/chip-group";
import { ESPECIALIDADES, TIPOS_IMOVEL, PERFIS_CLIENTE, TICKETS } from "@/data/broker-options";

export const Route = createFileRoute("/app/perfil")({
  component: ProfilePage,
});

function ProfilePage() {
  const [especialidades, setEspecialidades] = useState<string[]>([
    "Coberturas",
    "Casas em condomínio",
    "Alto padrão",
  ]);
  const [tipos, setTipos] = useState<string[]>(["Residencial", "Lançamentos"]);
  const [perfis, setPerfis] = useState<string[]>([
    "Família",
    "Investidor",
    "Mudança interestadual",
  ]);
  const [ticket, setTicket] = useState<string>("R$ 1M – R$ 3M");
  const [regioes, setRegioes] = useState<string[]>(["Niterói", "São Gonçalo", "Maricá", "Itaipu"]);

  const toggle = (state: string[], setState: (v: string[]) => void) => (label: string) => {
    setState(state.includes(label) ? state.filter((s) => s !== label) : [...state, label]);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Coluna esquerda */}
      <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-1 h-fit">
        <img
          src={broker.avatar}
          alt={broker.name}
          className="mx-auto h-32 w-32 rounded-full object-cover ring-4 ring-surface"
        />
        <div className="mt-4 text-center">
          <div className="font-display text-2xl">{broker.name}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            Essas informações são utilizadas para personalizar sua experiência na Ubroker.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs">
            <Award className="h-3.5 w-3.5 text-warm" /> Plano {broker.plan}
          </div>
        </div>
        <button className="mt-6 w-full rounded-md bg-navy px-3 py-2 text-sm text-navy-foreground">
          Fazer upgrade para Pro
        </button>
      </div>

      {/* Coluna direita */}
      <div className="space-y-4 lg:col-span-2">
        {/* Orientação */}
        <div className="flex items-start gap-2 rounded-xl border border-dashed border-border bg-surface/60 p-3 text-xs text-muted-foreground">
          <Sparkles className="mt-0.5 h-4 w-4 text-warm shrink-0" />
          <span>
            Essas informações ajudam a IA e outros corretores a entender melhor seu perfil de
            atuação. Quanto mais completo, melhor o sistema trabalha para você.
          </span>
        </div>

        {/* Informações */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Informações</div>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field icon={Mail} label="E-mail" value={broker.email} />
            <Field icon={Phone} label="Telefone" value={broker.phone} />
            <Field icon={MapPin} label="Região principal" value={broker.region} />
            <Field icon={Award} label="CRECI" value={broker.creci} />
          </dl>
        </div>

        {/* Regiões secundárias */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Regiões secundárias
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Outras regiões onde você atende.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {regioes.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs"
              >
                {r}
                <button
                  onClick={() => setRegioes(regioes.filter((x) => x !== r))}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remover ${r}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40">
              <Plus className="h-3 w-3" /> Adicionar região
            </button>
          </div>
        </div>

        {/* Perfil de atuação */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Perfil de atuação
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Usado pela IA e pelo matching de parcerias.
            </p>
          </div>

          <ChipGroup
            label="Especialidades"
            options={ESPECIALIDADES}
            selected={especialidades}
            onToggle={toggle(especialidades, setEspecialidades)}
          />

          <div>
            <div className="mb-2 text-sm font-medium">Faixa de ticket médio</div>
            <Select value={ticket} onValueChange={setTicket}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {TICKETS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ChipGroup
            label="Tipo de imóvel que trabalha"
            options={TIPOS_IMOVEL}
            selected={tipos}
            onToggle={toggle(tipos, setTipos)}
          />

          <ChipGroup
            label="Perfil de cliente"
            options={PERFIS_CLIENTE}
            selected={perfis}
            onToggle={toggle(perfis, setPerfis)}
          />
        </div>

        {/* Bio pública */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Bio pública</div>
          <textarea
            defaultValue="Corretor com 8 anos de experiência no alto padrão de Niterói. Especialista em coberturas e casas de praia. Atendimento concierge para famílias mudando do RJ e SP."
            placeholder="Descreva seu posicionamento, experiência e diferenciais no mercado."
            className="mt-3 w-full resize-none rounded-md border border-border bg-background p-3 text-sm"
            rows={4}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button className="rounded-md border border-border px-4 py-2 text-sm">Cancelar</button>
          <button className="rounded-md bg-navy px-4 py-2 text-sm text-navy-foreground">
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
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
