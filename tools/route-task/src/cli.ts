import { routeTask } from "./router.js";

function taskFromArguments(argumentsList: readonly string[]): string | undefined {
  const taskIndex = argumentsList.indexOf("--task");
  if (taskIndex < 0) return undefined;
  return argumentsList[taskIndex + 1];
}

async function main(): Promise<void> {
  const task = taskFromArguments(process.argv.slice(2));
  if (task === undefined) {
    process.stderr.write("Usage: route-task --task <task-description>\n");
    process.exitCode = 2;
    return;
  }
  const result = await routeTask({ task });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.status === "refused" ? 2 : 0;
}

void main();
