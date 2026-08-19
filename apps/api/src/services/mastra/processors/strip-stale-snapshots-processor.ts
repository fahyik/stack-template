import type { ProcessInputStepArgs, Processor } from "@mastra/core/processors";

const PLACEHOLDER =
  "[older snapshot omitted to save tokens — page state has changed; call browser_snapshot before acting on element refs]";

const KEEPABLE_FIELDS = [
  "url",
  "title",
  "elementCount",
  "scroll",
] as const satisfies readonly (keyof BrowserSnapshotResult)[];

interface BrowserSnapshotResult {
  success?: boolean;
  snapshot?: string;
  url?: string;
  title?: string;
  elementCount?: number;
  scroll?: string;
  hint?: string;
}

interface ToolInvocationLike {
  toolName?: string;
  state?: string;
  result?: unknown;
}

interface ToolInvocationPartLike {
  type: string;
  toolInvocation?: ToolInvocationLike;
  providerOptions?: Record<string, unknown>;
}

export interface StripStaleSnapshotsProcessorOptions {
  keepRecent?: number;
  setCacheBreakpoint?: boolean;
}

export class StripStaleSnapshotsProcessor implements Processor {
  readonly id = "strip-stale-browser-snapshots";

  private readonly keepRecent: number;
  private readonly setCacheBreakpoint: boolean;

  constructor(opts: StripStaleSnapshotsProcessorOptions = {}) {
    this.keepRecent = opts.keepRecent ?? 1;
    this.setCacheBreakpoint = opts.setCacheBreakpoint ?? true;
  }

  processInputStep({ messages }: ProcessInputStepArgs): undefined {
    const snapshotParts: ToolInvocationPartLike[] = [];

    for (const message of messages) {
      const parts = message.content?.parts;
      if (!Array.isArray(parts)) {
        continue;
      }
      for (const part of parts) {
        const candidate = part as ToolInvocationPartLike;
        if (
          candidate.type === "tool-invocation" &&
          candidate.toolInvocation?.toolName === "browser_snapshot" &&
          candidate.toolInvocation.state === "result"
        ) {
          snapshotParts.push(candidate);
        }
      }
    }

    if (snapshotParts.length === 0) {
      return;
    }

    const lastIndex = snapshotParts.length - 1;
    const firstFreshIndex = Math.max(0, snapshotParts.length - this.keepRecent);

    snapshotParts.forEach((part, idx) => {
      const invocation = part.toolInvocation;
      if (!invocation) {
        return;
      }
      const isFresh = idx >= firstFreshIndex;

      if (!isFresh) {
        const result = (invocation.result ?? {}) as BrowserSnapshotResult;
        if (result.snapshot !== PLACEHOLDER) {
          const trimmed: BrowserSnapshotResult = { snapshot: PLACEHOLDER };
          for (const field of KEEPABLE_FIELDS) {
            if (result[field] !== undefined) {
              (trimmed as Record<string, unknown>)[field] = result[field];
            }
          }
          invocation.result = trimmed;
        }
      }

      if (this.setCacheBreakpoint) {
        const isLatest = idx === lastIndex;
        if (isLatest) {
          part.providerOptions = {
            ...(part.providerOptions ?? {}),
            anthropic: { cacheControl: { type: "ephemeral" } },
          };
        } else if (part.providerOptions?.anthropic) {
          const { anthropic: _drop, ...rest } = part.providerOptions;
          part.providerOptions = rest;
        }
      }
    });

    return;
  }
}
