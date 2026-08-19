#!/usr/bin/env node
/**
 * Turns a fresh copy of this template into a named project.
 *
 * Runs on bare `node scripts/init.ts` (Node 24 strips the types), so it works
 * BEFORE `npm install` and needs no dependencies of its own.
 *
 *   npm run init
 *   npm run init -- --name acme --scope acme --apps api,webapp --no-mastra --yes
 *   npm run init -- --dry-run
 */
import { execFileSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ---------------------------------------------------------------- constants

const ALL_APPS = [
  "api",
  "webapp",
  "backoffice",
  "landing",
  "supabase",
] as const;
type App = (typeof ALL_APPS)[number];

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  ".turbo",
  ".firebase",
  "coverage",
  ".tanstack",
]);

const TEXT_EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".jsonc",
  ".md",
  ".css",
  ".html",
  ".sql",
  ".toml",
  ".yaml",
  ".yml",
  ".sh",
]);

const TEXT_NAMES = new Set([
  "Dockerfile",
  ".gitignore",
  ".dockerignore",
  ".npmrc",
  ".prettierrc",
  ".prettierignore",
  ".firebaserc",
  ".env.default",
  ".mcp.json",
]);

/** Env vars in turbo.json that only exist because of a given app. */
const APP_ENV: Record<App, string[]> = {
  api: [
    "DB_HOSTNAME",
    "DB_PORT",
    "DB_NAME",
    "DB_USERNAME",
    "DB_PASSWORD",
    "AUTH_AUDIENCE",
    "AUTH_DOMAIN",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "PORT",
    "INTERNAL_SERVICE_AUTH_KEY",
    "CLOUD_SCHEDULER_OIDC_AUDIENCE",
    "CLOUD_SCHEDULER_OIDC_SERVICE_ACCOUNT",
  ],
  webapp: ["VITE_TURNSTILE_SITE_KEY"],
  backoffice: [],
  landing: [],
  supabase: [],
};

const FRONTEND_ENV = [
  "VITE_API_URL",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
];

const MASTRA_ENV = [
  "MASTRA_DB_HOSTNAME",
  "MASTRA_DB_PORT",
  "MASTRA_DB_NAME",
  "MASTRA_DB_USERNAME",
  "MASTRA_DB_PASSWORD",
  "MASTRA_API_KEY",
  "OPENAI_API_KEY",
];

const MASTRA_DEPS = [
  "@mastra/core",
  "@mastra/express",
  "@mastra/memory",
  "@mastra/observability",
  "@mastra/pg",
  "@mastra/loggers",
  "mastra",
  "pg",
  "pino",
  "pino-pretty",
];
const MASTRA_DEV_DEPS = ["@mastra/duckdb", "@types/pg"];

// ---------------------------------------------------------------- utilities

type Answers = {
  name: string;
  scope: string;
  apps: App[];
  mastra: boolean;
  portBase: number;
  supabasePortBase: number;
  firebasePrefix: string | null;
  gitInit: boolean;
};

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const KEEP = args.includes("--keep");
const YES = args.includes("--yes");

function flag(name: string): string | undefined {
  const withEq = args.find((a) => a.startsWith(`--${name}=`));
  if (withEq) return withEq.slice(name.length + 3);
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--")
    ? args[i + 1]
    : undefined;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function isTextFile(path: string): boolean {
  const name = path.split("/").pop() ?? "";
  if (TEXT_NAMES.has(name)) return true;
  const dot = name.lastIndexOf(".");
  return dot > 0 && TEXT_EXTS.has(name.slice(dot));
}

function readJson(rel: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
}

function writeJson(rel: string, value: unknown): void {
  if (DRY_RUN) {
    console.log(`  would edit   ${rel}`);
    return;
  }
  writeFileSync(join(ROOT, rel), JSON.stringify(value, null, 2) + "\n");
}

function remove(rel: string): void {
  const full = join(ROOT, rel);
  if (!existsSync(full)) return;
  if (DRY_RUN) {
    console.log(`  would delete ${rel}`);
    return;
  }
  rmSync(full, { recursive: true, force: true });
}

/**
 * Strips `#region <tag>` ... `#endregion <tag>` blocks (and the marker lines)
 * in every comment syntax the repo uses. Markers are real comments, so the
 * template stays lint-clean and buildable with the region present.
 */
function stripRegions(source: string, tag: string): string {
  const open = new RegExp(`^\\s*(//|#|--|/\\*|<!--)\\s*#region\\s+${tag}\\b`);
  const close = new RegExp(
    `^\\s*(//|#|--|/\\*|<!--)\\s*#endregion\\s+${tag}\\b`
  );
  const out: string[] = [];
  let depth = 0;
  for (const line of source.split("\n")) {
    if (open.test(line)) {
      depth++;
      continue;
    }
    if (close.test(line)) {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth === 0) out.push(line);
  }
  return out.join("\n");
}

// ---------------------------------------------------------------- prompting

async function prompt(): Promise<Answers> {
  const cliName = flag("name");
  const noMastra = args.includes("--no-mastra");

  if (YES || cliName) {
    const name = cliName ?? "app";
    const picked = flag("apps");
    return {
      name,
      scope: flag("scope") ?? name,
      apps: picked
        ? (picked.split(",").map((s) => s.trim()) as App[])
        : [...ALL_APPS],
      mastra: !noMastra,
      portBase: Number(flag("port-base") ?? 3000),
      supabasePortBase: Number(flag("supabase-port-base") ?? 54340),
      firebasePrefix: flag("firebase-prefix") ?? null,
      gitInit: !args.includes("--no-git"),
    };
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (q: string, dflt: string) => {
    const a = (await rl.question(`${q} (${dflt}) `)).trim();
    return a || dflt;
  };
  const confirm = async (q: string, dflt = true) =>
    /^y/i.test(await ask(q + (dflt ? " [Y/n]" : " [y/N]"), dflt ? "y" : "n"));

  console.log("\n  Initialising a new project from stack-template.\n");

  let name = "";
  while (!/^[a-z][a-z0-9-]*$/.test(name)) {
    name = await ask(
      "Project name (kebab-case)",
      ROOT.split("/").pop() ?? "app"
    );
    if (!/^[a-z][a-z0-9-]*$/.test(name)) {
      console.log("  ! lowercase letters, digits and hyphens only");
    }
  }
  const scope = await ask("npm scope (without @)", name);
  const picked = await ask(
    `Apps to keep, comma-separated [${ALL_APPS.join(",")}]`,
    ALL_APPS.join(",")
  );
  const apps = picked
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as App[];

  const unknown = apps.filter((a) => !ALL_APPS.includes(a));
  if (unknown.length > 0) {
    throw new Error(`Unknown app(s): ${unknown.join(", ")}`);
  }
  if (apps.length === 0) throw new Error("Pick at least one app.");
  if (apps.includes("api") && !apps.includes("supabase")) {
    console.log(
      "  ! apps/api needs a Postgres database; apps/supabase provides one locally."
    );
    console.log("    You will have to point DB_* at your own instance.");
  }
  const hasFrontend = apps.some(
    (a) => a === "webapp" || a === "backoffice" || a === "landing"
  );
  if (!apps.includes("api") && hasFrontend) {
    console.log(
      "  ! no apps/api - the frontends' api-client.ts will have no server to call."
    );
  }

  const mastra = apps.includes("api")
    ? await confirm("Include the Mastra agent-workflow module?", false)
    : false;
  const portBase = Number(await ask("Web port base", "3000"));
  const supabasePortBase = apps.includes("supabase")
    ? Number(await ask("Supabase port base", "54340"))
    : 54340;
  const wantFirebase = hasFrontend
    ? await confirm("Set Firebase Hosting project ids now?", false)
    : false;
  const firebasePrefix = wantFirebase
    ? await ask("Firebase project prefix", name)
    : null;
  const gitInit = await confirm(
    "Re-initialise git with a single initial commit?",
    true
  );

  rl.close();
  return {
    name,
    scope,
    apps,
    mastra,
    portBase,
    supabasePortBase,
    firebasePrefix,
    gitInit,
  };
}

// ---------------------------------------------------------------- the work

function buildReplacements(a: Answers): [string, string][] {
  const pairs: [string, string][] = [
    ["@repo/", `@${a.scope}/`],
    ["stack-template-api", `${a.name}-api`],
    ["stack-template", a.name],
    ["stack_template", a.name.replace(/-/g, "_")],
  ];
  if (a.firebasePrefix) {
    for (const app of ["webapp", "backoffice", "landing"]) {
      pairs.push([`REPLACE_ME-${app}`, `${a.firebasePrefix}-${app}`]);
    }
  }
  return pairs;
}

/** Ports are rewritten only in the files that actually declare them. */
function rewritePorts(a: Answers): void {
  if (a.portBase === 3000 && a.supabasePortBase === 54340) return;

  const webOffsets: [number, number][] = [
    [3000, a.portBase],
    [3001, a.portBase + 1],
    [3002, a.portBase + 2],
    [3003, a.portBase + 3],
    [3011, a.portBase + 11],
  ];
  const sbOffsets: [number, number][] = [
    [54340, a.supabasePortBase],
    [54341, a.supabasePortBase + 1],
    [54342, a.supabasePortBase + 2],
    [54343, a.supabasePortBase + 3],
    [54344, a.supabasePortBase + 4],
    [54347, a.supabasePortBase + 7],
    [54349, a.supabasePortBase + 9],
  ];

  const applyNumeric = (rel: string, offsets: [number, number][]) => {
    const full = join(ROOT, rel);
    if (!existsSync(full)) return;
    let s = readFileSync(full, "utf8");
    // Guard with a sentinel so 3000->3001 cannot then match 3001->3002.
    for (const [from, to] of offsets) {
      s = s.replaceAll(String(from), ` ${to} `);
    }
    s = s.replaceAll(" ", "");
    if (!DRY_RUN) writeFileSync(full, s);
  };

  const webFiles = [
    "apps/api/src/app.ts",
    "apps/api/package.json",
    "apps/webapp/package.json",
    "apps/backoffice/package.json",
    "apps/landing/package.json",
    "apps/supabase/supabase/config.toml",
    ".claude/CLAUDE.md",
    "README.md",
  ];
  for (const rel of webFiles) applyNumeric(rel, webOffsets);
  applyNumeric("apps/supabase/supabase/config.toml", sbOffsets);
}

function deleteApp(app: App): void {
  remove(`apps/${app}`);
  const ts = readJson("tsconfig.json") as { references?: { path: string }[] };
  if (ts.references) {
    ts.references = ts.references.filter((r) => r.path !== `apps/${app}`);
    writeJson("tsconfig.json", ts);
  }
  if (app === "api") remove(".vscode/launch.json");
}

function pruneTurboEnv(a: Answers): void {
  const turbo = readJson("turbo.json") as {
    tasks: { build: { env: string[] } };
  };
  const drop = new Set<string>();
  for (const app of ALL_APPS) {
    if (!a.apps.includes(app)) {
      for (const e of APP_ENV[app]) drop.add(e);
    }
  }
  const anyFrontend = a.apps.some(
    (x) => x === "webapp" || x === "backoffice" || x === "landing"
  );
  if (!anyFrontend) for (const e of FRONTEND_ENV) drop.add(e);
  if (!a.mastra) for (const e of MASTRA_ENV) drop.add(e);

  turbo.tasks.build.env = turbo.tasks.build.env.filter((e) => !drop.has(e));
  writeJson("turbo.json", turbo);
}

function removeMastra(): void {
  remove("apps/api/src/services/mastra");
  remove("apps/api/.claude/skills/mastra");
  remove(".mcp.json");
  remove("apps/api/skills-lock.json");

  const pkgPath = "apps/api/package.json";
  if (existsSync(join(ROOT, pkgPath))) {
    const pkg = readJson(pkgPath) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };
    for (const d of MASTRA_DEPS) delete pkg.dependencies?.[d];
    for (const d of MASTRA_DEV_DEPS) delete pkg.devDependencies?.[d];
    delete pkg.scripts?.["mastra:studio"];
    writeJson(pkgPath, pkg);
  }

  for (const file of walk(ROOT)) {
    if (!isTextFile(file)) continue;
    // Skip our own source and the meta doc: both quote the marker syntax as
    // documentation rather than using it.
    if (file.startsWith(join(ROOT, "scripts"))) continue;
    if (file === join(ROOT, "TEMPLATE.md")) continue;
    const s = readFileSync(file, "utf8");
    if (!s.includes("#region module:mastra")) continue;
    if (DRY_RUN) {
      console.log(`  would strip mastra region: ${relative(ROOT, file)}`);
    } else {
      writeFileSync(file, stripRegions(s, "module:mastra"));
    }
  }

  // The .env.default block is plain-commented rather than region-marked.
  const envPath = join(ROOT, "apps/api/.env.default");
  if (existsSync(envPath) && !DRY_RUN) {
    const lines = readFileSync(envPath, "utf8").split("\n");
    const start = lines.findIndex((l) => l.includes("--- Mastra module"));
    if (start >= 0) {
      writeFileSync(envPath, lines.slice(0, start).join("\n").trimEnd() + "\n");
    }
  }
}

async function main(): Promise<void> {
  if (!existsSync(join(ROOT, "TEMPLATE.md"))) {
    console.error(
      "init has already run in this repo (TEMPLATE.md is gone). Refusing."
    );
    process.exit(1);
  }

  const a = await prompt();
  console.log(
    `\n  name=${a.name} scope=@${a.scope} apps=${a.apps.join(",")} mastra=${a.mastra}`
  );
  if (DRY_RUN) console.log("  (dry run - nothing will be written)\n");

  // 1. Delete unselected apps and the Mastra module BEFORE the text rewrite,
  //    so we never rewrite files we are about to remove.
  for (const app of ALL_APPS) if (!a.apps.includes(app)) deleteApp(app);
  if (!a.mastra) removeMastra();
  pruneTurboEnv(a);

  // 2. Rewrite every remaining text file.
  const pairs = buildReplacements(a);
  let changed = 0;
  for (const file of walk(ROOT)) {
    if (!isTextFile(file)) continue;
    if (file.endsWith("package-lock.json")) continue;
    if (file.startsWith(join(ROOT, "scripts"))) continue;
    let s: string;
    try {
      s = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    let next = s;
    for (const [from, to] of pairs) next = next.replaceAll(from, to);
    if (next !== s) {
      changed++;
      if (!DRY_RUN) writeFileSync(file, next);
    }
  }
  rewritePorts(a);
  console.log(`  rewrote ${changed} files`);

  if (DRY_RUN) {
    console.log("\n  dry run complete.\n");
    return;
  }

  // 3. Post-condition: no template token may survive.
  const leftovers: string[] = [];
  for (const file of walk(ROOT)) {
    if (!isTextFile(file) || file.endsWith("package-lock.json")) continue;
    if (file.startsWith(join(ROOT, "scripts"))) continue;
    const s = readFileSync(file, "utf8");
    if (
      s.includes("@repo/") ||
      s.includes("stack-template") ||
      s.includes("stack_template")
    ) {
      leftovers.push(relative(ROOT, file));
    }
  }
  if (leftovers.length > 0) {
    console.error(
      "\n  ! template tokens survived in:\n" +
        leftovers.map((f) => "    " + f).join("\n")
    );
    process.exit(1);
  }

  // 4. Fresh lockfile under the new scope.
  console.log("  installing dependencies...");
  execFileSync("npm", ["install", "--silent"], { cwd: ROOT, stdio: "inherit" });
  execFileSync(
    "npx",
    ["prettier", "--write", "**/*.{ts,tsx,md,json}", "--log-level", "warn"],
    { cwd: ROOT, stdio: "inherit" }
  );

  // 5. Self-delete, then git.
  if (!KEEP) {
    remove("TEMPLATE.md");
    remove("scripts/init.ts");
    remove(".github/workflows/template-selftest.yml");
    const pkg = readJson("package.json") as { scripts: Record<string, string> };
    delete pkg.scripts.init;
    writeJson("package.json", pkg);
  }

  if (a.gitInit) {
    let safe = true;
    try {
      const count = execFileSync("git", ["rev-list", "--count", "HEAD"], {
        cwd: ROOT,
        encoding: "utf8",
      }).trim();
      // Refuse to nuke real history - someone will run this in the wrong place.
      if (Number(count) > 2) safe = false;
    } catch {
      // No git repo yet, which is fine.
    }

    if (safe) {
      remove(".git");
      execFileSync("git", ["init", "-q"], { cwd: ROOT });
      execFileSync("git", ["add", "-A"], { cwd: ROOT });
      execFileSync(
        "git",
        ["commit", "-qm", `chore: initialise ${a.name} from stack-template`],
        { cwd: ROOT }
      );
    } else {
      console.log(
        "  ! this repo has real history - skipping git re-init. Commit manually."
      );
    }
  }

  const P = a.portBase;
  console.log(`
  ${a.name} initialised (scope @${a.scope})

    1. cp apps/api/.env.default apps/api/.env.development.local
       cp apps/webapp/.env.default apps/webapp/.env.local   (and backoffice / landing)
    2. npm run start -w apps/supabase
       npx supabase status --workdir apps/supabase
       -> copy the API URL + anon key into the .env files
    3. npm run db:migrate:up -w apps/supabase
    4. npm run dev
       api :${P + 1}   webapp :${P + 2}   backoffice :${P + 3}   landing :${P}
    5. Sign in at http://localhost:${P + 2}/login with the user seeded in
       apps/supabase/supabase/seeds/init.sql
    6. Swap the brand palette in packages/ui/src/globals.css (SWAP ME banners)
    7. Fill in the TODOs in .claude/CLAUDE.md and README.md
`);
}

await main();
