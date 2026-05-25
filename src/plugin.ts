import type {
  HyperPlugin,
  InternalRequest,
  HttpClientOptions,
  HttpResponse,
  PluginContext,
} from "@hyperttp/core";
import { QueueManager } from "./utils/QueueManager.js";

declare module "@hyperttp/core" {
  interface HyperttpPluginsExtension {
    queue?: { enabled?: boolean };
  }

  interface HyperCore {
    getStats: () => Record<string, unknown> & {
      queuedRequests?: number;
      activeRequests?: number;
    };
  }
}

export function withQueue(options?: { maxConcurrent?: number }): HyperPlugin {
  let queue: QueueManager;

  return {
    name: "hyperttp-queue",
    phase: "CONTROL",
    enabled: (config: HttpClientOptions) => !!config.queue?.enabled,

    setup(ctx: PluginContext) {
      const { core, config } = ctx;
      const maxConcurrent =
        options?.maxConcurrent ?? config.network?.maxConcurrent ?? 500;
      queue = new QueueManager(maxConcurrent);

      const originalGetStats =
        typeof core.getStats === "function"
          ? core.getStats.bind(core)
          : () => ({});

      core.getStats = () => ({
        ...originalGetStats(),
        queuedRequests: queue.queuedCount,
        activeRequests: queue.activeCount,
      });
    },

    wrapDispatch: (next) => {
      return async <T>(req: InternalRequest): Promise<HttpResponse<T>> => {
        const { signal } = req;

        if (signal?.aborted) {
          throw new DOMException("The user aborted a request.", "AbortError");
        }

        return queue.enqueue<HttpResponse<T>>(async () => {
          if (signal?.aborted) {
            throw new DOMException("The user aborted a request.", "AbortError");
          }
          return next<T>(req);
        });
      };
    },
  };
}
