/**
 * @ru Функция для освобождения захваченного слота в очереди.
 * @en Function to release an acquired slot in the queue.
 */
type Release = () => void;
/**
 * @ru Менеджер очереди с ограничением конкурентных запросов.
 * @en Queue manager with concurrent request limit.
 */
export declare class QueueManager {
    private running;
    private readonly _maxConcurrent;
    private readonly waiters;
    /**
     * @ru Создаёт менеджер очереди.
     * @en Creates a queue manager.
     * @param maxConcurrent - @ru Максимальное количество одновременно выполняемых операций. @en Maximum number of concurrent operations.
     */
    constructor(maxConcurrent?: number);
    /**
     * @ru Запрашивает слот для выполнения операции.
     * @en Acquires a slot to execute an operation.
     * @param signal - @ru AbortSignal для отмены ожидания. @en AbortSignal to cancel waiting.
     * @returns @ru Promise с функцией освобождения слота. @en Promise with a release function.
     */
    acquire(signal?: AbortSignal): Promise<Release>;
    /**
     * @ru Освобождает занятый слот и запускает следующий ожидающий запрос.
     * @en Releases an acquired slot and starts the next waiting request.
     */
    private release;
    /**
     * @ru Текущее количество активных операций.
     * @en Current number of active operations.
     */
    get activeCount(): number;
    /**
     * @ru Количество операций, ожидающих в очереди.
     * @en Number of operations waiting in the queue.
     */
    get queuedCount(): number;
}
export {};
//# sourceMappingURL=QueueManager.d.ts.map