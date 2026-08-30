import { cp, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const sourceApps = [
  ["imposter", "imposter"],
  ["planner-habit", "habit-tracker"],
  ["planner-todo", "todo-board"],
  ["planner-timer", "timer"],
  ["planner-assignments", "assignments"],
];
const destinationRoot = resolve(repositoryRoot, "apps/hub/public/microapps");

for (const [sourceName, routeName] of sourceApps) {
  const source = resolve(repositoryRoot, "apps", sourceName);
  const destination = resolve(destinationRoot, routeName);
  await mkdir(destination, { recursive: true });
  await cp(source, destination, {
    recursive: true,
    filter: (entry) => !entry.includes("/node_modules") && !entry.includes("/.turbo") && !entry.includes("/dist"),
  });
  await writeFile(
    resolve(destination, "forge-preview-config.js"),
    `window.__FORGE_LOCAL_PREVIEW__ = ${process.env.VITE_ENABLE_LOCAL_PREVIEW === "true"};\n`,
  );
}
