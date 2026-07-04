import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mail, Phone, MapPin, Award, Sparkles, X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { broker } from "@/data/mock";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChipGroup } from "@/components/chip-group";
import { AvatarUpload } from "@/components/avatar-upload";
import { ESPECIALIDADES, TIPOS_IMOVEL, PERFIS_CLIENTE, TICKETS } from "@/data/broker-options";
import {
  updateBrokerProfile,
  uploadAvatar,
  useBrokerProfile,
  useSession,
  type BrokerProfile,
} from "@/lib/auth";

export const Route = createFileRoute("/app/perfil")({
  component: ProfilePage,
});

function ProfilePage() {
  const { session } = useSession();
  const initialProfile = useBrokerProfile();
  // Cópia local do perfil: atualizada após salvar (retorno do update)
  const [profile, setProfile] = useState<BrokerProfile | null>(null);

  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);
  const [perfis, setPerfis] = useState<string[]>([]);
  const [ticket, setTicket] = useState<string>("");
  const [regioes, setRegioes] = useState<string[]>([]);
  const [bio, setBio] = useState<string>("");
  const [regiaoInput, setRegiaoInput] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const seeded = useRef(false);

  function seedFrom(p: BrokerProfile) {
    setEspecialidades(p.specialties ?? []);
    setTipos(p.property_types ?? []);
    setPerfis(p.client_profiles ?? []);
    setTicket(p.ticket_range ?? "");
    setRegioes(p.regions ?? []);
    setBio(p.bio ?? "");
    setAvatarFile(null);
  }

  useEffect(() => {
    if (initialProfile && !seeded.current) {
      seeded.current = true;
      setProfile(initialProfile);
      seedFrom(initialProfile);
    }
  }, [initialProfile]);

  const toggle = (state: string[], setState: (v: string[]) => void) => (label: string) => {
    setState(state.includes(label) ? state.filter((s) => s !== label) : [...state, label]);
  };

  function addRegiao() {
    const value = regiaoInput.trim();
    if (!value) return;
    if (!regioes.includes(value)) setRegioes([...regioes, value]);
    setRegiaoInput("");
  }

  async function handleSave() {
    if (!session) return;
    setSaving(true);

    let avatar_url: string | undefined;
    if (avatarFile) {
      avatar_url = (await uploadAvatar(session.user.id, avatarFile)) ?? undefined;
    }

    const updated = await updateBrokerProfile(session.user.id, {
      specialties: especialidades,
      property_types: tipos,
      client_profiles: perfis,
      ticket_range: ticket || null,
      regions: regioes,
      bio: bio || null,
      ...(avatar_url ? { avatar_url } : {}),
    });
    setSaving(false);

    if (updated) {
      setProfile(updated);
      setAvatarFile(null);
      toast.success("Perfil atualizado!");
    } else {
      toast.error("Não foi possível salvar. Tente novamente.");
    }
  }

  // Dados exibidos: perfil real com fallback no mock (protótipo)
  const displayName = profile?.full_name ?? broker.name;
  const displayPlan = profile?.plan ?? broker.plan;
  const displayEmail = session?.user.email ?? broker.email;
  const displayPhone = profile?.phone || broker.phone;
  const displayRegion = profile?.regions?.[0] ?? broker.region;
  const displayCreci = profile?.creci || broker.creci;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Coluna esquerda */}
      <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-1 h-fit">
        <div className="flex justify-center">
          <AvatarUpload
            file={avatarFile}
            value={profile?.avatar_url ?? broker.avatar}
            onFileChange={setAvatarFile}
            className="flex-col text-center"
          />
        </div>
        <div className="mt-4 text-center">
          <div className="font-display text-2xl">{displayName}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            Essas informações são utilizadas para personalizar sua experiência na Ubroker.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs">
            <Award className="h-3.5 w-3.5 text-warm" /> Plano {displayPlan}
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
            <Field icon={Mail} label="E-mail" value={displayEmail} />
            <Field icon={Phone} label="Telefone" value={displayPhone} />
            <Field icon={MapPin} label="Região principal" value={displayRegion} />
            <Field icon={Award} label="CRECI" value={displayCreci} />
          </dl>
        </div>

        {/* Regiões de atuação */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Regiões de atuação
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Regiões onde você atende.</p>
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
            <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5">
              <input
                value={regiaoInput}
                onChange={(e) => setRegiaoInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRegiao();
                  }
                }}
                placeholder="Adicionar região"
                className="w-32 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={addRegiao}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Adicionar região"
              >
                <Plus className="h-3 w-3" />
              </button>
            </span>
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
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Descreva seu posicionamento, experiência e diferenciais no mercado."
            className="mt-3 w-full resize-none rounded-md border border-border bg-background p-3 text-sm"
            rows={4}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => profile && seedFrom(profile)}
            disabled={saving || !profile}
            className="rounded-md border border-border px-4 py-2 text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !session}
            className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm text-navy-foreground disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
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
