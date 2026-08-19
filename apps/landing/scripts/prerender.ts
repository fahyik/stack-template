import { readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const distDir = resolve(root, "dist");
const indexPath = resolve(distDir, "index.html");
const serverDir = resolve(distDir, "server");
const serverEntry = resolve(serverDir, "entry-server.js");

// Routes are declared once in src/routes.ts and shared with src/App.tsx, so
// adding a page can't leave the two out of sync. Firebase Hosting
// (cleanUrls: true) serves `/about` from `about.html`.
const { routes } = (await import(
  pathToFileURL(resolve(root, "src/routes.ts")).href
)) as typeof import("../src/routes.ts");

const { render } = (await import(pathToFileURL(serverEntry).href)) as {
  render: (url: string) => string;
};

const template = await readFile(indexPath, "utf8");
const placeholder = '<div id="root"></div>';

if (!template.includes(placeholder)) {
  throw new Error(`Could not find ${placeholder} in ${indexPath}`);
}

for (const route of routes) {
  const html = render(route.path);
  const output = template.replace(placeholder, `<div id="root">${html}</div>`);
  const outPath = resolve(distDir, route.out);
  await writeFile(outPath, output, "utf8");
  console.log(`Prerendered ${outPath} (${html.length} chars)`);
}

await rm(serverDir, { recursive: true, force: true });
