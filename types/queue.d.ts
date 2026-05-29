/**
 * @ru Опции конфигурации для очереди запросов.
 * @en Configuration options for the request queue.
 */
export interface QueueOptions {
    /**
     * @ru Включить очередь запросов.
     * @en Enable the request queue.
     */
    enabled?: boolean;
}
/**
 * @ru Функция-исполнитель, возвращающая Promise.
 * @en An executor function that returns a Promise.
 */
export type Executor<T> = () => Promise<T>;
/**
 * @ru Узел связного списка, представляющий задачу в очереди.
 * @en A linked list node representing a task in the queue.
 */
export interface QueueNode {
    /**
     * @ru Функция, запускающая асинхронную задачу.
     * @en The function that triggers the asynchronous task.
     */
    executor: () => Promise<unknown>;
    /**
     * @ru Функция разрешения промиса задачи.
     * @en The resolution handler for the task promise.
     */
    resolve: (value: unknown) => void;
    /**
     * @ru Функция отклонения промиса задачи.
     * @en The rejection handler for the task promise.
     */
    reject: (reason?: unknown) => void;
    /**
     * @ru Ссылка на следующий узел в очереди.
     * @en Reference to the next node in the queue.
     */
    next: QueueNode | null;
}
/**
 * @ru Планировщик для выполнения колбэков.
 * @en A scheduler function for executing callbacks.
 */
export type Scheduler = (cb: () => void) => void;
//# sourceMappingURL=queue.d.ts.map