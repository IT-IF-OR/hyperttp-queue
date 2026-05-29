/**
 * @ru Менеджер очереди с ограничением конкурентных запросов.
 * @en Queue manager with concurrent request limit.
 */
export class QueueManager {
    running = 0;
    _maxConcurrent;
    waiters = [];
    /**
     * @ru Создаёт менеджер очереди.
     * @en Creates a queue manager.
     * @param maxConcurrent - @ru Максимальное количество одновременно выполняемых операций. @en Maximum number of concurrent operations.
     */
    constructor(maxConcurrent = 50) {
        this._maxConcurrent = Math.max(1, Math.floor(maxConcurrent));
    }
    /**
     * @ru Запрашивает слот для выполнения операции.
     * @en Acquires a slot to execute an operation.
     * @param signal - @ru AbortSignal для отмены ожидания. @en AbortSignal to cancel waiting.
     * @returns @ru Promise с функцией освобождения слота. @en Promise with a release function.
     */
    acquire(signal) {
        if (signal?.aborted) {
            return Promise.reject(new DOMException("The user aborted a request.", "AbortError"));
        }
        if (this.running < this._maxConcurrent) {
            this.running++;
            return Promise.resolve(() => this.release());
        }
        return new Promise((resolve, reject) => {
            const waiter = {
                resolve: (res) => {
                    if (signal && onAbort)
                        signal.removeEventListener("abort", onAbort);
                    resolve(res);
                },
                reject: (err) => {
                    if (signal && onAbort)
                        signal.removeEventListener("abort", onAbort);
                    reject(err);
                },
            };
            this.waiters.push(waiter);
            const onAbort = () => {
                const idx = this.waiters.indexOf(waiter);
                if (idx >= 0)
                    this.waiters.splice(idx, 1);
                waiter.reject(new DOMException("The user aborted a request.", "AbortError"));
            };
            signal?.addEventListener("abort", onAbort, { once: true });
        });
    }
    /**
     * @ru Освобождает занятый слот и запускает следующий ожидающий запрос.
     * @en Releases an acquired slot and starts the next waiting request.
     */
    release() {
        this.running--;
        const waiter = this.waiters.shift();
        if (waiter) {
            this.running++;
            waiter.resolve(() => this.release());
        }
    }
    /**
     * @ru Текущее количество активных операций.
     * @en Current number of active operations.
     */
    get activeCount() {
        return this.running;
    }
    /**
     * @ru Количество операций, ожидающих в очереди.
     * @en Number of operations waiting in the queue.
     */
    get queuedCount() {
        return this.waiters.length;
    }
}
//# sourceMappingURL=QueueManager.js.map