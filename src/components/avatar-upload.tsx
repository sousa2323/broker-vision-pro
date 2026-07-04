import { useEffect, useRef, useState } from "react";
import { Camera, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/**
 * Seletor de foto/avatar com preview circular. Devolve o File selecionado
 * ao pai via onFileChange (o upload em si é feito por quem consome).
 * `value` mostra uma foto já existente (modo edição).
 */
export function AvatarUpload({
  file,
  value,
  onFileChange,
  className,
}: {
  file?: File | null;
  value?: string | null;
  onFileChange: (file: File | null) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(value ?? null);
  }, [file, value]);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    e.target.value = ""; // permite reenviar o mesmo arquivo
    if (!selected) return;
    if (!ACCEPTED.includes(selected.type)) {
      toast.error("Use uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (selected.size > MAX_SIZE) {
      toast.error("A imagem deve ter no máximo 2 MB.");
      return;
    }
    onFileChange(selected);
  }

  const hasImage = Boolean(preview);

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-surface"
        aria-label="Enviar foto"
      >
        {hasImage ? (
          <img src={preview!} alt="Foto do corretor" className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-5 w-5 text-muted-foreground" />
        )}
        <span className="absolute inset-0 hidden place-items-center bg-black/40 text-white group-hover:grid">
          <Camera className="h-4 w-4" />
        </span>
      </button>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface"
          >
            <Upload className="h-3.5 w-3.5" /> {hasImage ? "Trocar foto" : "Enviar foto"}
          </button>
          {hasImage && (
            <button
              type="button"
              onClick={() => onFileChange(null)}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remover
            </button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">JPG, PNG ou WebP · até 2 MB.</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={handleSelect}
      />
    </div>
  );
}
