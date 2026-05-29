import { QueueManager } from "./utils/QueueManager.js";
/**
 * @ru Создаёт плагин очереди запросов с ограничением конкурентности.
 * @en Creates a request queue plugin with concurrency limit.
 *
 * @returns @ru Плагин для Hyperttp. @en Hyperttp plugin.
 *
 * @example
 * ```typescript
 * const client = new HttpClient({
 *   plugins: [withQueue()],
 *   queue: { enabled: true },
 *   network: { maxConcurrent: 10 }
 * });
 * ```
 */
export function withQueue() {
    let queue;
    const releases = new WeakMap();
    return {
        name: "hyperttp-queue",
        /**
         * @ru Проверяет, включена ли очередь в конфигурации.
         * @en Checks if queue is enabled in configuration.
         */
        enabled: (config) => !!config.queue?.enabled,
        /**
         * @ru Инициализирует менеджер очереди.
         * @en Initializes the queue manager.
         */
        setup(ctx) {
            const maxConcurrent = ctx.config.network?.maxConcurrent ?? 500;
            queue = new QueueManager(maxConcurrent);
        },
        /**
         * @ru Обрабатывает запрос перед отправкой, запрашивая слот в очереди.
         * @en Handles request before sending, acquiring a queue slot.
         *
         * @param req - @ru Внутренний объект запроса. @en Internal request object.
         * @throws {DOMException} @ru Если запрос был отменён. @en If request was aborted.
         */
        async onRequest(req) {
            if (req.signal?.aborted) {
                throw new DOMException("The user aborted a request.", "AbortError");
            }
            const release = await queue.acquire(req.signal);
            releases.set(req, release);
        },
        /**
         * @ru Освобождает слот после успешного ответа.
         * @en Releases the slot after a successful response.
         *
         * @param _res - @ru Ответ от сервера (не используется). @en Server response (unused).
         * @param req - @ru Объект запроса. @en Request object.
         */
        onResponse(_res, req) {
            releases.get(req)?.();
            releases.delete(req);
        },
        /**
         * @ru Освобождает слот при возникновении ошибки.
         * @en Releases the slot when an error occurs.
         *
         * @param _err - @ru Объект ошибки (не используется). @en Error object (unused).
         * @param req - @ru Объект запроса. @en Request object.
         */
        onError(_err, req) {
            releases.get(req)?.();
            releases.delete(req);
        },
    };
}
//# sourceMappingURL=plugin.js.map