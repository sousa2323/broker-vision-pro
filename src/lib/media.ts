import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

// O bucket property-media é privado: o banco guarda paths e a exibição usa
// signed URLs. O cache de módulo garante que o mesmo path resolva para a
// mesma URL por ~55min (assinatura de 1h), preservando o cache do <img>.
const SIGN_TTL_SECONDS = 3600;
const CACHE_TTL_MS = 55 * 60_000;

const cache = new Map<string, { url: string; expiresAt: number }>();

function isExternalUrl(value: string) {
  return /^https?:\/\//.test(value);
}

/** Resolve paths do bucket property-media em signed URLs (com cache e lote). */
export async function signPropertyMedia(paths: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const now = Date.now();
  const missing: string[] = [];

  for (const path of new Set(paths.filter(Boolean))) {
    if (isExternalUrl(path)) {
      result.set(path, path);
      continue;
    }
    const cached = cache.get(path);
    if (cached && cached.expiresAt > now) {
      result.set(path, cached.url);
    } else {
      missing.push(path);
    }
  }

  if (missing.length) {
    const { data, error } = await supabase.storage
      .from("property-media")
      .createSignedUrls(missing, SIGN_TTL_SECONDS);
    if (error) {
      console.error("Falha ao assinar URLs de mídia:", error.message);
    } else {
      for (const item of data ?? []) {
        if (item.signedUrl && item.path) {
          cache.set(item.path, { url: item.signedUrl, expiresAt: now + CACHE_TTL_MS });
          result.set(item.path, item.signedUrl);
        }
      }
    }
  }

  return result;
}

/**
 * Hook em lote: recebe paths (ou URLs legadas) e retorna um mapa path -> URL
 * exibível. Paths ainda não resolvidos ficam ausentes do mapa.
 */
export function usePropertyMediaUrls(
  paths: (string | null | undefined)[],
): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = useMemo(() => paths.filter(Boolean).join("|"), [paths]);

  useEffect(() => {
    const wanted = key ? key.split("|") : [];
    if (!wanted.length) {
      setUrls({});
      return;
    }
    let cancelled = false;
    void signPropertyMedia(wanted).then((map) => {
      if (!cancelled) setUrls(Object.fromEntries(map));
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return urls;
}
