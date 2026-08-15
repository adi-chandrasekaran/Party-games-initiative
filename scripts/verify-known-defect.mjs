import { spawnSync } from "node:child_process";

const defects = {
  "BD-001": {
    name: "Quiz Shooter client implicit choice type",
    command: ["pnpm", ["--filter", "quiz-shooter-3d-client", "run", "build"]],
    error: /Parameter ['\"]choice['\"] implicitly has an ['\"]any['\"] type/,
  },
  "BD-002": {
    name: "Build A Beast client void truthiness",
    command: ["pnpm", ["--filter", "build-a-beast-client", "run", "build"]],
    error: /expression of type ['\"]void['\"] cannot be tested for truthiness/i,
  },
};

const defect = defects[process.argv[2]];
if (!defect) {
  throw new Error(`Expected one of: ${Object.keys(defects).join(", ")}`);
}

const [command, args] = defect.command;
const result = spawnSync(command, args, { encoding: "utf8" });
const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
if (result.status === 0 || !defect.error.test(output)) {
  process.stderr.write(`${defect.name} no longer matches its documented baseline defect.\n${output}`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Expected baseline defect confirmed: ${defect.name} (${process.argv[2]})\n`);
}
