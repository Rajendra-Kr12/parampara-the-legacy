# route-task

`route-task` classifies a task into the Parampara routing tiers and selects an allowed catalog model. It is optional tooling. Static routing remains available when Laya cannot run.

## Setup

This standalone tool requires Node.js 22 or later and has one runtime dependency, the Vercel AI SDK. `typescript` and `@types/node` are local development dependencies used to compile and test the strict TypeScript source. It does not add a root workspace, a Vercel CLI, or a Vercel plugin.

```sh
npm --prefix tools/route-task install
npm --prefix tools/route-task test
```

## Use

From the repository root:

```sh
npm --prefix tools/route-task run route -- --task "Classify a public documentation update."
```

At runtime, the tool reads `AI_GATEWAY_API_KEY` from the process environment or the repository `.env.local`. It never prints the key or the task text. The live Laya call uses `experimental_evaluate` from `ai` with model ID `convaiinnovations/laya` and the Boundless provider.

Output includes `routingPath`. `laya` means the live classifier was used. `static` means the static table was used, includes a `fallbackReason`, and sets `requiresHumanOrLeadDecision`.

After 2026-10-31, static routing is the default. Set `ROUTE_TASK_ENABLE_PAID_LAYA=true` only after the owner has enabled a paid Laya budget in Vercel AI Gateway.

The tool refuses task input that appears to include secrets or personal data. Rewrite such a task before routing it.

## Live check

The live Laya call is not run by automated tests. After adding the key to the repository `.env.local`, the owner can run:

```sh
npm --prefix tools/route-task run route -- --task "Classify a public documentation update."
```
