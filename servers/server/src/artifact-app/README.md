# Artifact App

`artifact-app` is the application-development subsystem. It owns app projects, isolated sandboxes, the Pi coding agent, development previews, and releases.

Mastra may invoke this subsystem through its public application contracts, but this subsystem must not depend on Mastra.

## Module boundaries

- `contracts`: framework-neutral input and output contracts exposed to callers.
- `application`: use cases that coordinate sandboxes, the coding agent, task branches, and task state.
- `sandbox`: sandbox lifecycle and workspace isolation (`local` holds the local child-process implementation).
- `agent`: Pi SDK integration, model runtime, sessions, resources, coding tools, and LLM recording.
- `preview`: Vite development-server lifecycle, preview addressing, and the HTTP/WebSocket preview proxy.
- `shared`: Node-level helpers reused across modules (process-tree termination, error-message normalization).
- `startup`: the composition root that wires the concrete implementations together.
- `release`: production builds and immutable static releases. **Not implemented yet.**

## Entry points

Everything outside this subsystem enters through these three:

- `startup/create-artifact-app-service.ts` — `createArtifactAppRuntime` / `createArtifactAppService`, called by `src/mastra/runtime.ts`.
- `application/artifact-app-service.ts` — `ArtifactAppService.executeCodeTask`, called by the Mastra `delegate-app-code` tool.
- `preview/local/artifact-app-preview-proxy.ts` — `ArtifactAppPreviewProxy`, mounted by `src/server.ts` on `/artifact-apps/:appId/`.
