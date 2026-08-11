#!/usr/bin/env node

import { spawn } from "node:child_process";
import path from "node:path";
import readline from "node:readline";

const rootDir = process.cwd();
const apps = [
  { name: "HUB", cwd: "apps/hub", url: "http://localhost:5176", command: "npm", args: ["run", "dev"] },
  { name: "IMPOSTER", cwd: "apps/imposter", url: "http://localhost:5181", command: "npm", args: ["run", "dev"] },
  { name: "QUIZ", cwd: "apps/quiz-shooter", url: "http://localhost:5173", command: "npm", args: ["run", "dev"] },
  { name: "BEAST", cwd: "apps/build-a-beast", url: "http://localhost:5174", command: "npm", args: ["run", "dev"] },
  { name: "HABIT", cwd: "apps/planner-habit", url: "http://localhost:5314", command: "npm", args: ["run", "dev"] },
  { name: "TODO", cwd: "apps/planner-todo", url: "http://localhost:5315", command: "npm", args: ["run", "dev"] },
  { name: "TIMER", cwd: "apps/planner-timer", url: "http://localhost:5316", command: "npm", args: ["run", "dev"] },
  { name: "ASSIGN", cwd: "apps/planner-assignments", url: "http://localhost:5317", command: "npm", args: ["run", "dev"] },
];

const children = [];
let shuttingDown = false;

function prefixStream(prefix, stream, target) {
  const rl = readline.createInterface({ input: stream });
  rl.on("line", (line) => {
    target.write(`${prefix}${line}\n`);
  });
  stream.on("close", () => rl.close());
}

function startApp(app) {
  const cwd = path.join(rootDir, app.cwd);
  const child = spawn(app.command, app.args, {
    cwd,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  children.push({ app, child });

  const prefix = `[${app.name}] `;
  process.stdout.write(`${prefix}starting at ${app.url}\n`);
  prefixStream(prefix, child.stdout, process.stdout);
  prefixStream(prefix, child.stderr, process.stderr);

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    const state = signal ? `signal ${signal}` : `code ${code}`;
    process.stderr.write(`${prefix}stopped with ${state}\n`);
    if (code !== 0 && code !== null) {
      process.stderr.write(`${prefix}If this app is not listening, reinstall its dependencies or check the port.\n`);
    }
  });

  child.on("error", (error) => {
    if (shuttingDown) return;
    process.stderr.write(`${prefix}${error.message}\n`);
  });
}

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  process.stdout.write(`Stopping Forge apps (${signal})...\n`);
  for (const { child } of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
  setTimeout(() => process.exit(0), 500);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.stdout.write("Launching all Forge apps:\n");
for (const app of apps) {
  process.stdout.write(`- ${app.name}: ${app.url}\n`);
}
process.stdout.write("\n");

for (const app of apps) {
  startApp(app);
}
