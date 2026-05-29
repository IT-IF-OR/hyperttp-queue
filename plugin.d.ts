import type { HyperPlugin } from "@hyperttp/types";
/**
 * @ru Расширение типов для поддержки очереди запросов.
 * @en Type extension for request queue support.
 */
declare module "@hyperttp/types" {
    interface HyperttpPluginsExtension {
        /**
         * @ru Конфигурация очереди запросов.
         * @en Request queue configuration.
         */
        queue?: {
            enabled?: boolean;
        };
    }
}
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
export declare function withQueue(): HyperPlugin;
//# sourceMappingURL=plugin.d.ts.map