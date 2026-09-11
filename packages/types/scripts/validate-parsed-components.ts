/**
 * 校验 parsed-components 中的默认数据是否与对应的 Zod schema 匹配
 *
 * 用法: npx tsx scripts/validate-parsed-components.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { componentPropSchemaMap } from "../src/schemas/components/propSchemaMap";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parsedDir = path.join(__dirname, "../src/schemas/parsed-components");

const files: { name: string; fullPath: string }[] = [];
function collectJsonFiles(dir: string, prefix = "") {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      collectJsonFiles(path.join(dir, entry.name), entry.name + "/");
    } else if (entry.name.endsWith(".json")) {
      files.push({ name: prefix + entry.name, fullPath: path.join(dir, entry.name) });
    }
  }
}
collectJsonFiles(parsedDir);

let totalValidated = 0;
let totalPassed = 0;
let totalSkipped = 0;
const failures: {
  file: string;
  prop: string;
  dataErrors?: string[];
  optionErrors?: string[];
}[] = [];

for (const { name, fullPath } of files) {
  const prop = path.basename(name, ".json");
  const schemas = componentPropSchemaMap[prop as keyof typeof componentPropSchemaMap];

  if (!schemas) {
    totalSkipped++;
    continue;
  }

  const raw = fs.readFileSync(fullPath, "utf-8");
  const parsed = JSON.parse(raw);
  const data = parsed.config?.data;
  const option = parsed.config?.option;

  totalValidated++;
  const dataErrors: string[] = [];
  const optionErrors: string[] = [];

  // 校验 data
  if (data !== undefined) {
    const result = schemas.data.safeParse(data);
    if (!result.success) {
      for (const issue of result.error.issues) {
        dataErrors.push(`${issue.path.join(".") || "(root)"}: ${issue.message}`);
      }
    }
  }

  // 校验 option
  if (option !== undefined) {
    const result = schemas.option.safeParse(option);
    if (!result.success) {
      for (const issue of result.error.issues) {
        optionErrors.push(`${issue.path.join(".") || "(root)"}: ${issue.message}`);
      }
    }
  }

  if (dataErrors.length > 0 || optionErrors.length > 0) {
    failures.push({
      file: name,
      prop,
      dataErrors: dataErrors.length ? dataErrors : undefined,
      optionErrors: optionErrors.length ? optionErrors : undefined
    });
  } else {
    totalPassed++;
  }
}

console.log("\n========== Schema Validation Results ==========\n");
console.log(`  Total files:     ${files.length}`);
console.log(`  Validated:       ${totalValidated}`);
console.log(`  Passed:          ${totalPassed}`);
console.log(`  Failed:          ${failures.length}`);
console.log(`  Skipped (no schema): ${totalSkipped}`);

if (failures.length > 0) {
  console.log("\n========== Failures ==========\n");
  for (const f of failures) {
    console.log(`❌ ${f.file} (${f.prop})`);
    if (f.dataErrors?.length) {
      console.log("   Data errors:");
      f.dataErrors.forEach((e) => console.log(`     - ${e}`));
    }
    if (f.optionErrors?.length) {
      console.log("   Option errors:");
      f.optionErrors.forEach((e) => console.log(`     - ${e}`));
    }
    console.log();
  }
  process.exit(1);
} else {
  console.log("\n✅ All validations passed!\n");
}
