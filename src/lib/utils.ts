import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "Ramon Cardozo Capone" -> "ramon-cardozo-capone" (sem acentos) */
export function slugify(input: string): string {
  return input
    .normalize("NFD") // decompõe acentos em combining marks
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
