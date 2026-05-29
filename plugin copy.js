import { QueueManager } from "./utils/QueueManager2.js";
export function withQueue() {
    let queue;
    const releases = new WeakMap();
    return {
        name: "hyperttp-queue",
        enabled: (config) => !!config.queue?.enabled,
        setup(ctx) {
            const maxConcurrent = ctx.config.network?.maxConcurrent ?? 500;
            queue = new QueueManager(maxConcurrent);
        },
        async onRequest(req) {
            if (req.signal?.aborted) {
                throw new DOMException("The user aborted a request.", "AbortError");
            }
            const release = await queue.acquire(req.signal);
            releases.set(req, release);
        },
        onResponse(_res, req) {
            releases.get(req)?.();
            releases.delete(req);
        },
        onError(_err, req) {
            releases.get(req)?.();
            releases.delete(req);
        },
    };
}
//# sourceMappingURL=plugin%20copy.js.map