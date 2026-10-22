// Checks the test guide: every image a page uses exists in public/, and every #/guide/<id> link points to a page.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const dir = "docs/test-guide";
const files = readdirSync(dir).filter((f) => f.endsWith(".md") && !/^(README|screenshots)\.md$/i.test(f));
const ids = new Set(files.map((f) => readFileSync(join(dir, f), "utf8").match(/^id:\s*(.+)$/m)?.[1].trim() ?? f.replace(/\.md$/, "")));
const problems = [];
const used = new Set();

for (const f of files) {
  const text = readFileSync(join(dir, f), "utf8");
  for (const m of text.matchAll(/!\[[^\]]*\]\((\/guide\/[^)\s]+)\)/g)) {
    used.add(m[1]);
    if (!existsSync(join("public", m[1]))) problems.push(`${f}: missing image ${m[1]}`);
  }
  for (const m of text.matchAll(/\]\(#\/guide\/([\w-]+)\)/g)) if (!ids.has(m[1])) problems.push(`${f}: link to unknown page ${m[1]}`);
}

// The tour links to pages of the guide
const tour = readFileSync("src/components/OnboardingOverlay.tsx", "utf8");
for (const m of tour.matchAll(/guideId:\s*'([\w-]+)'/g)) if (!ids.has(m[1])) problems.push(`OnboardingOverlay.tsx: guideId ${m[1]} is not a page of the guide`);

const unused = [];
const walk = (d) => readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(join(d, e.name)) : !used.has("/" + join(d, e.name).replace(/^public\//, "")) && unused.push(join(d, e.name))));
if (existsSync("public/guide")) walk("public/guide");

console.log(`${files.length} pages, ${used.size} images used`);
if (unused.length) console.log(`Unused images:\n  ${unused.join("\n  ")}`);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("Guide OK");
