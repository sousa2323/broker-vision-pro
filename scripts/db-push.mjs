// Aplica um arquivo .sql no banco Supabase via Management API.
// Uso: node scripts/db-push.mjs supabase/migrations/0003_broker_operations.sql
//
// Lê ACCESS_TOKEN e o ref do projeto (de VITE_SUPABASE_URL) do .env.
// A Management API executa o SQL com privilégios de owner — ideal para DDL/RLS.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const env = {};
  const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const file = process.argv[2];
if (!file) {
  console.error("Uso: node scripts/db-push.mjs <arquivo.sql>");
  process.exit(1);
}

const env = loadEnv();
const token = env.ACCESS_TOKEN;
const ref = (env.VITE_SUPABASE_URL || "").match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!token || !ref) {
  console.error("ACCESS_TOKEN ou VITE_SUPABASE_URL ausentes no .env");
  process.exit(1);
}

const query = readFileSync(resolve(process.cwd(), file), "utf8");

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query }),
});

const text = await res.text();
if (!res.ok) {
  console.error(`❌ Falha (${res.status}):`, text);
  process.exit(1);
}
console.log(`✅ Aplicado: ${file}`);
console.log(text);
