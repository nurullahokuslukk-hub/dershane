// Node'un yerleşik test koşucusu (`node --test`) için `@/...` alias'ını
// çözen resolve hook'u. Böylece saf mantık modüllerini (doğrulama, özet
// hesapları) ekstra bir test bağımlılığı eklemeden test edebiliyoruz —
// tsconfig'deki paths yalnızca TypeScript/Next tarafında geçerli, Node
// çalışma zamanı onu bilmiyor.
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const srcRoot = path.resolve(import.meta.dirname, "..", "src");

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const target = path.join(srcRoot, specifier.slice(2));
      const withExt = path.extname(target) ? target : `${target}.ts`;
      return { url: pathToFileURL(withExt).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
