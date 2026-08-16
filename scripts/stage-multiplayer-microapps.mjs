import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const repositoryRoot = resolve(import.meta.dirname, "..");
const microapps = [
  ["apps/quiz-shooter/client", "quiz-shooter"],
  ["apps/build-a-beast/client", "build-a-beast"],
];

for (const [clientDirectory, routeName] of microapps) {
  const destination = resolve(repositoryRoot, "apps/hub/public/microapps", routeName);
  await run(
    "pnpm",
    [
      "--dir",
      resolve(repositoryRoot, clientDirectory),
      "exec",
      "vite",
      "build",
      "--base",
      "./",
      "--outDir",
      destination,
      "--emptyOutDir",
    ],
    { cwd: repositoryRoot },
  );
}
