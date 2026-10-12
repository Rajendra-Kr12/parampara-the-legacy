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

At runtime, the tool reads `AI_GATEWAY_API_KEY` from the process environment or the repository `.env.local`. It never prints the key or the task text. The live Laya call uses `experimental_decide` from `ai` (7.0.128 or later; `experimental_evaluate` is its deprecated alias) with model ID `convaiinnovations/laya`. The request follows the documented examples: `state` is the task description as a plain string, and `providerOptions.gateway.only` is `["boundless"]`. Both `convaiinnovations/laya` and `convaiinnovations/laya-free` are free through 2026-10-31 on Boundless; the standard ID is the one that keeps working after. Laya sees the task description only. The router applies the catalog's tier and class columns locally after Laya answers, so no catalog content is sent to Laya. The default timeout is 30 seconds.

Output includes `routingPath`. `laya` means the live classifier was used. `static` means the static table was used, includes a `fallbackReason`, and sets `requiresHumanOrLeadDecision`.

When Laya fails, `fallbackReason` is one of `laya-timeout`, `laya-auth`, `laya-rate-limited`, `laya-model-unavailable`, `laya-provider-restricted`, `laya-bad-request` (HTTP 400 or 422), `laya-bad-response`, or `laya-unknown`. It is derived from the error class and HTTP status only. Add `--diagnose` to also print a `diagnostic` object with the category, error class name, HTTP status code, and, when the provider error carries one as a short token, a provider error code and failing field name. No message body, key, task text, or path is ever included.

After 2026-10-31, static routing is the default. Set `ROUTE_TASK_ENABLE_PAID_LAYA=true` only after the owner has enabled a paid Laya budget in Vercel AI Gateway.

The tool refuses task input that appears to include secrets or personal data. Rewrite such a task before routing it. Task descriptions must never contain real family data or secrets, and the router does not detect all of them.

## Live check

The live Laya call is not run by automated tests. From the repository root, with the key added to the repository `.env.local`:

```sh
git checkout feat/para-router   # only if not already on the branch
npm --prefix tools/route-task install
npm --prefix tools/route-task run route -- --task "Classify a public documentation update." --diagnose
```

`routingPath: "laya"` means the live call worked. If it shows `static`, report the `fallbackReason` and `diagnostic` values.

If the call still fails, run `npm --prefix tools/route-task run route -- --diagnose-request` to print the request shape (task replaced by a placeholder, no network call) and paste it back together with the `--diagnose` output.
