import { describeLayaRequest } from "./laya.js";
import { loadDefaultCatalog, routeTask } from "./router.js";
import type { Catalog, RoutingDecision } from "./types.js";

export interface CliIo {
  readonly loadCatalog?: () => Promise<Catalog>;
  readonly route?: (options: { readonly task: string; readonly diagnose?: boolean }) => Promise<RoutingDecision>;
  readonly stdout: (text: string) => void;
  readonly stderr: (text: string) => void;
}

function taskFromArguments(argumentsList: readonly string[]): string | undefined {
  const taskIndex = argumentsList.indexOf("--task");
  if (taskIndex < 0) return undefined;
  return argumentsList[taskIndex + 1];
}

/** Returns the process exit code. Setup failures never expose raw errors or paths. */
export async function runCli(argumentsList: readonly string[], io: CliIo): Promise<number> {
  if (argumentsList.includes("--diagnose-request")) {
    try {
      io.stdout(`${JSON.stringify(describeLayaRequest(await (io.loadCatalog ?? loadDefaultCatalog)()), null, 2)}\n`);
      return 0;
    } catch {
      io.stderr("Unable to route task. Check the model catalog and gateway configuration.\n");
      return 1;
    }
  }
  const task = taskFromArguments(argumentsList);
  if (task === undefined) {
    io.stderr("Usage: route-task --task <task-description> [--diagnose] | --diagnose-request\n");
    return 2;
  }
  try {
    const result = await (io.route ?? routeTask)({ task, diagnose: argumentsList.includes("--diagnose") });
    io.stdout(`${JSON.stringify(result, null, 2)}\n`);
    return result.status === "refused" ? 2 : 0;
  } catch {
    io.stderr("Unable to route task. Check the model catalog and gateway configuration.\n");
    return 1;
  }
}
