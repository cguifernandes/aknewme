// Hooks de módulo do Node para os testes rodarem o código de src/ direto (com --experimental-strip-types):
// "@/x" vira src/x, e import sem extensão ganha ".ts" (ou "/index.ts"), como no bundler do Next.
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = new URL("../src/", import.meta.url);

export async function resolve(specifier, context, next) {
  let spec = specifier.startsWith("@/") ? new URL(specifier.slice(2), SRC).href : specifier;
  const relative = spec.startsWith(".") || spec.startsWith("file:");
  if (relative && !/\.[cm]?[jt]sx?$/.test(spec)) {
    const base = new URL(spec, context.parentURL);
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      const file = fileURLToPath(base) + ext;
      if (existsSync(file)) {
        spec = pathToFileURL(file).href;
        break;
      }
    }
  }
  return next(spec, context);
}
