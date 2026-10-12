import { parse } from "yaml";

const PINNED = /^[^@\s]+@[0-9a-f]{40}$/;

const isMapping = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

function triggers(workflow) {
  const on = workflow.on ?? workflow[true];
  if (typeof on === "string") return [on];
  if (Array.isArray(on)) return on;
  if (isMapping(on)) return Object.keys(on);
  return [];
}

function checkUses(uses, problems) {
  if (uses.startsWith("./")) return;
  if (uses.startsWith("docker://")) {
    problems.push("docker:// actions are not allowed");
  } else if (!PINNED.test(uses)) {
    problems.push(`action not pinned by commit SHA: ${uses}`);
  }
}

/**
 * Policy checks for a GitHub Actions workflow, parsed from YAML.
 * Returns a list of problems; an empty list means the workflow passes.
 */
export function checkWorkflow(text) {
  const problems = [];
  const workflow = parse(text);
  if (!isMapping(workflow)) return ["workflow is not a YAML mapping"];

  const permissions = workflow.permissions;
  if (permissions === undefined || permissions === null) {
    problems.push("missing top-level permissions block");
  } else if (!isMapping(permissions)) {
    problems.push("permissions must be a block mapping, not an inline value");
  } else if (JSON.stringify(permissions) !== JSON.stringify({ contents: "read" })) {
    problems.push(
      `top-level permissions must be exactly "contents: read", found: ${JSON.stringify(permissions)}`,
    );
  }

  if (triggers(workflow).includes("pull_request_target")) {
    problems.push("pull_request_target is not allowed");
  }

  const jobs = isMapping(workflow.jobs) ? Object.values(workflow.jobs) : [];
  for (const job of jobs) {
    if (!isMapping(job)) continue;
    if ("permissions" in job) problems.push("job-level permissions are not allowed yet");
    if (typeof job.uses === "string") checkUses(job.uses, problems);
    const steps = Array.isArray(job.steps) ? job.steps : [];
    for (const step of steps) {
      if (!isMapping(step) || typeof step.uses !== "string") continue;
      checkUses(step.uses, problems);
    }
  }
  return problems;
}
