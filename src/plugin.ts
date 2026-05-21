import type {
  HyperCore,
  HyperPlugin,
  InternalRequest,
  HttpClientOptions,
} from "@hyperttp/core";
import { QueueManager } from "./utils/QueueManager.js";

export function withQueue(client: HyperCore, maxConcurrent: number): HyperCore {
  const queue = new QueueManager(maxConcurrent);
  const next = client.dispatch;
  const originalGetStats = client.getStats.bind(client);

  client.getStats = () => ({
    ...originalGetStats(),
    queuedRequests: queue.queuedCount,
    activeRequests: queue.activeCount,
  });

  client.dispatch = (req: InternalRequest) => {
    return queue.enqueue(() => next(req));
  };

  return client;
}

declare module "@hyperttp/core" {
  interface HyperttpPluginsExtension {
    queue?: { enabled?: boolean };
    network?: { maxConcurrent?: number };
  }
}

export const QueuePlugin: HyperPlugin = {
  name: "hyperttp-queue",
  phase: "CONTROL",
  enabled: (config: HttpClientOptions) => !!config.queue?.enabled,
  apply: (client: HyperCore, config: HttpClientOptions) => {
    return withQueue(client, config.network?.maxConcurrent || 500);
  },
};
