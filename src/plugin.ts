import type {
  HyperPlugin,
  InternalRequest,
  HttpClientOptions,
  HttpResponse,
  PluginContext,
  HyperttpError,
} from "@hyperttp/types";
import { QueueManager } from "./utils/QueueManager.js";

declare module "@hyperttp/types" {
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

/**
 * @ru Плагин управления очередью запросов для HyperCore на базе плоских хуков жизненного цикла.
 * @en Request queue management plugin for HyperCore based on flat lifecycle hooks.
 * * @param options - @ru Настройки лимитов конкурентности. @en Concurrency limit configurations.
 * @returns @ru Экземпляр плагина HyperPlugin. @en HyperPlugin object instance.
 */
export function withQueue(): HyperPlugin {
  let queue: QueueManager;

  /**
   * @ru Карта триггеров для удерживания и последующего освобождения слотов внутри QueueManager.
   * @en Map of execution triggers used to retain and release active slots within QueueManager.
   */
  const activeTokens = new WeakMap<InternalRequest, () => void>();

  return {
    /**
     * @ru Уникальное имя плагина для логирования и предотвращения дублирования в конвейере.
     * @en Unique plugin identifier for logging and pipeline deduplication.
     */
    name: "hyperttp-queue",

    /**
     * @ru Динамическая проверка необходимости активации плагина на основе конфигурации клиента.
     * @en Dynamic check to evaluate if the plugin should activate based on client settings.
     */
    enabled: (config: HttpClientOptions): boolean => !!config.queue?.enabled,

    /**
     * @ru Хук инициализации. Создает экземпляр QueueManager и расширяет сборщик метрик ядра.
     * @en Initialization hook. Creates the QueueManager instance and decorates the core metrics collector.
     */
    setup(ctx: PluginContext): void {
      const { core, config } = ctx;
      const maxConcurrent = config.network?.maxConcurrent ?? 500;

      queue = new QueueManager(maxConcurrent);

      const originalGetStats =
        typeof (core as any).getStats === "function"
          ? (core as any).getStats.bind(core)
          : () => ({});

      (core as any).getStats = () => ({
        ...originalGetStats(),
        queuedRequests: queue.queuedCount,
        activeRequests: queue.activeCount,
      });
    },

    /**
     * @ru Перехватчик фазы запроса. Приостанавливает выполнение конвейера до момента выделения слота пулом.
     * @en Request phase interceptor. Suspends pipeline execution until a pool slot is allocated.
     */
    async onRequest(req: InternalRequest): Promise<void> {
      const { signal } = req;

      if (signal?.aborted) {
        throw new DOMException("The user aborted a request.", "AbortError");
      }

      await new Promise<void>((resolveOnRequest, rejectOnRequest) => {
        queue
          .enqueue(async () => {
            if (signal?.aborted) {
              throw new DOMException(
                "The user aborted a request.",
                "AbortError",
              );
            }

            // Возвращаем внутренний Promise, блокируя handleSuccess в QueueManager
            return new Promise<void>((resolveSlot) => {
              activeTokens.set(req, resolveSlot);

              // Пропускаем onRequest дальше по цепочке хуков ядра наружу в сеть
              resolveOnRequest();
            });
          })
          .catch((err) => {
            rejectOnRequest(err);
          });
      });
    },

    /**
     * @ru Перехватчик успешного ответа. Сигнализирует пулу о завершении операции и освобождает рабочий слот.
     * @en Response phase interceptor. Signals the pool of operation completion and releases the worker slot.
     */
    onResponse(_res: HttpResponse<any>, req: InternalRequest): void {
      const resolveSlot = activeTokens.get(req);
      if (resolveSlot) {
        resolveSlot();
        activeTokens.delete(req);
      }
    },

    /**
     * @ru Перехватчик ошибок конвейера. Гарантирует возврат ноды в пул при сетевых сбоях или отменах.
     * @en Error phase interceptor. Guarantees node return to the pool on network failures or aborts.
     */
    onError(_err: HyperttpError, req: InternalRequest): void {
      const resolveSlot = activeTokens.get(req);
      if (resolveSlot) {
        resolveSlot();
        activeTokens.delete(req);
      }
    },
  };
}
