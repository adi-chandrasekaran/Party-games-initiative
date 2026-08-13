import { spawnSync } from "node:child_process";

const expectedFailures = [
  {
    name: "Quiz Shooter client implicit choice type",
    command: ["npm", ["run", "build", "--prefix", "apps/quiz-shooter/client"]],
    error: /Parameter ['\"]choice['\"] implicitly has an ['\"]any['\"] type/,
    defect: "docs/architecture/baseline-defects.md#bd-001-quiz-shooter-client-build",
  },
  {
    name: "Build A Beast client void truthiness",
    command: ["npm", ["run", "build", "--prefix", "apps/build-a-beast/client"]],
    error: /expression of type ['\"]void['\"] cannot be tested for truthiness/i,
    defect: "docs/architecture/baseline-defects.md#bd-002-build-a-beast-client-build",
  },
];

for (const expected of expectedFailures) {
  const [command, args] = expected.command;
  const result = spawnSync(command, args, { encoding: "utf8" });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  if (result.status === 0 || !expected.error.test(output)) {
    process.stderr.write(
      `${expected.name} no longer matches its documented baseline defect (${expected.defect}).\n${output}`,
    );
    process.exitCode = 1;
    continue;
  }

  process.stdout.write(`Expected baseline defect confirmed: ${expected.name} (${expected.defect})\n`);
}
