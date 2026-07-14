import { useEffect, useRef, useState } from "react";
import { ImagePlus, Video, X, Star, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_FOTOS = 20;
const MAX_FOTO_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
const FOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export type MediaItem =
  | { id: string; kind: "existing"; path: string; url: string }
  | { id: string; kind: "new"; file: File };

/**
 * Galeria de mídia do imóvel: várias fotos (a primeira é a capa, reordenável
 * por arraste) + 1 vídeo. Igual ao AvatarUpload, o upload em si é feito pelo
 * pai no submit — aqui só coletamos File/URL e a ordem escolhida.
 */
export function PropertyMediaUpload({
  items,
  onItemsChange,
  videoFile,
  videoUrl,
  onVideoChange,
}: {
  items: MediaItem[];
  onItemsChange: (items: MediaItem[]) => void;
  videoFile: File | null;
  videoUrl: string | null;
  onVideoChange: (file: File | null, url: string | null) => void;
}) {
  const fotoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(videoUrl);

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setVideoPreview(videoUrl);
  }, [videoFile, videoUrl]);

  function handleFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (selected.length === 0) return;

    const livres = MAX_FOTOS - items.length;
    if (livres <= 0) {
      toast.error(`Máximo de ${MAX_FOTOS} fotos por imóvel.`);
      return;
    }
    const validas: MediaItem[] = [];
    for (const f of selected) {
      if (validas.length >= livres) {
        toast.error(`Máximo de ${MAX_FOTOS} fotos — algumas não foram adicionadas.`);
        break;
      }
      if (!FOTO_TYPES.includes(f.type)) {
        toast.error(`"${f.name}": use JPG, PNG ou WebP.`);
        continue;
      }
      if (f.size > MAX_FOTO_SIZE) {
        toast.error(`"${f.name}": máximo de 5 MB por foto.`);
        continue;
      }
      validas.push({ id: crypto.randomUUID(), kind: "new", file: f });
    }
    if (validas.length) onItemsChange([...items, ...validas]);
  }

  function removeFoto(id: string) {
    onItemsChange(items.filter((it) => it.id !== id));
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    const next = items.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onItemsChange(next);
  }

  function handleVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!VIDEO_TYPES.includes(f.type)) {
      toast.error("Vídeo: use MP4, MOV ou WebM.");
      return;
    }
    if (f.size > MAX_VIDEO_SIZE) {
      toast.error("Vídeo: máximo de 50 MB.");
      return;
    }
    onVideoChange(f, null);
  }

  return (
    <div className="space-y-4">
      {/* Fotos */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">
            Fotos ({items.length}/{MAX_FOTOS})
          </label>
          {items.length > 1 && (
            <span className="text-[11px] text-muted-foreground">Arraste para definir a capa</span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((it, i) => (
            <MediaThumb
              key={it.id}
              item={it}
              isCover={i === 0}
              isDragOver={dragOver === i}
              onRemove={() => removeFoto(it.id)}
              onDragStart={() => (dragIndex.current = i)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(i);
              }}
              onDrop={() => {
                if (dragIndex.current !== null) reorder(dragIndex.current, i);
                dragIndex.current = null;
                setDragOver(null);
              }}
              onDragEnd={() => {
                dragIndex.current = null;
                setDragOver(null);
              }}
            />
          ))}

          {items.length < MAX_FOTOS && (
            <button
              type="button"
              onClick={() => fotoInput.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-surface text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-[10px]">Adicionar</span>
            </button>
          )}
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          JPG, PNG ou WebP · até 5 MB cada.
        </p>
        <input
          ref={fotoInput}
          type="file"
          accept={FOTO_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={handleFotos}
        />
      </div>

      {/* Vídeo */}
      <div>
        <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
          Vídeo (opcional)
        </label>
        {videoPreview ? (
          <div className="relative overflow-hidden rounded-lg border border-border bg-black">
            <video src={videoPreview} controls className="max-h-48 w-full" />
            <button
              type="button"
              onClick={() => onVideoChange(null, null)}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
              aria-label="Remover vídeo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => videoInput.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface px-4 py-6 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Video className="h-5 w-5" /> Adicionar vídeo
          </button>
        )}
        <p className="mt-1.5 text-[11px] text-muted-foreground">MP4, MOV ou WebM · até 50 MB.</p>
        <input
          ref={videoInput}
          type="file"
          accept={VIDEO_TYPES.join(",")}
          className="hidden"
          onChange={handleVideo}
        />
      </div>
    </div>
  );
}

function MediaThumb({
  item,
  isCover,
  isDragOver,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  item: MediaItem;
  isCover: boolean;
  isDragOver: boolean;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const [src, setSrc] = useState<string>(item.kind === "existing" ? item.url : "");

  useEffect(() => {
    if (item.kind === "new") {
      const url = URL.createObjectURL(item.file);
      setSrc(url);
      return () => URL.revokeObjectURL(url);
    }
    setSrc(item.url);
  }, [item]);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative aspect-square cursor-grab overflow-hidden rounded-lg border border-border bg-surface active:cursor-grabbing",
        isCover && "ring-2 ring-brand",
        isDragOver && "ring-2 ring-brand/60",
      )}
    >
      {src && <img src={src} alt="" className="h-full w-full object-cover" />}

      {isCover && (
        <span className="absolute left-1 top-1 inline-flex items-center gap-1 rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
          <Star className="h-2.5 w-2.5" /> Capa
        </span>
      )}

      <span className="absolute bottom-1 left-1 grid h-5 w-5 place-items-center rounded bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
        <GripVertical className="h-3 w-3" />
      </span>

      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
        aria-label="Remover foto"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
