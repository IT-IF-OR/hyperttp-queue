import type { QueueNode, Executor } from "../types/queue.js";

/**
 * @ru Высокопроизводительный менеджер очереди задач с поддержкой пулинга нод.
 * @en High-performance task queue manager featuring node pooling.
 */
export class QueueManager {
  private running = 0;
  private queued = 0;

  private head: QueueNode | null = null;
  private tail: QueueNode | null = null;

  private _maxConcurrent: number;

  private pool: QueueNode[] = [];
  private poolSize = 0;
  private readonly maxPoolSize = 10000;

  /**
   * @ru Создает экземпляр менеджера очереди.
   * @en Creates an instance of the queue manager.
   * @param maxConcurrent - Maximum number of concurrently active tasks.
   */
  constructor(maxConcurrent = 50) {
    this._maxConcurrent = Math.max(1, Math.floor(maxConcurrent));
  }

  /**
   * @ru Возвращает текущий лимит конкурентности.
   * @en Returns the current concurrency limit.
   */
  get maxConcurrent(): number {
    return this._maxConcurrent;
  }

  /**
   * @ru Динамически изменяет лимит конкурентности и инициирует сброс очереди.
   * @en Dynamically adjusts the concurrency limit and triggers a queue drain.
   */
  set maxConcurrent(value: number) {
    this._maxConcurrent = Math.max(1, Math.floor(value));
    this.drain();
  }

  /**
   * @ru Добавляет асинхронную задачу в очередь.
   * @en Adds an asynchronous task to the queue.
   * @param executor - The executor function returning a Promise.
   * @returns A promise that resolves with the task execution result.
   */
  enqueue<T>(executor: Executor<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let node: QueueNode;

      if (this.poolSize > 0) {
        node = this.pool[--this.poolSize];
        node.executor = executor as () => Promise<unknown>;
        node.resolve = resolve as (value: unknown) => void;
        node.reject = reject;
        node.next = null;
      } else {
        node = {
          executor: executor as () => Promise<unknown>,
          resolve: resolve as (value: unknown) => void,
          reject,
          next: null,
        };
      }

      if (this.tail !== null) {
        this.tail.next = node;
      } else {
        this.head = node;
      }

      this.tail = node;
      this.queued++;

      if (this.running < this._maxConcurrent) {
        this.drain();
      }
    });
  }

  /**
   * @ru Полностью очищает очередь, отклоняя все ожидающие задачи.
   * @en Clears the queue entirely, rejecting all pending tasks.
   * @param reason - The error instance used to reject the pending tasks.
   */
  clear(reason = new Error("Queue has been cleared")): void {
    let current = this.head;

    this.head = null;
    this.tail = null;
    this.queued = 0;

    while (current !== null) {
      current.reject(reason);
      const next = current.next;
      this.releaseNode(current);
      current = next;
    }
  }

  /**
   * @private
   * @ru Продвигает очередь вперед, запускает задачи в рамках лимита.
   * @en Advances the queue forward, executing tasks within the concurrency limit.
   */
  private drain(): void {
    while (this.running < this._maxConcurrent && this.head !== null) {
      const task = this.head;
      this.head = task.next;

      if (this.head === null) {
        this.tail = null;
      }

      this.queued--;
      this.running++;

      this.executeTask(task);
    }
  }

  /**
   * @private
   * @ru Запускает асинхронное выполнение задачи.
   * @en Executes the given task node asynchronously.
   * @param task - The queue node to execute.
   */
  private executeTask(task: QueueNode): void {
    try {
      task.executor().then(
        (val) => this.handleSuccess(task, val),
        (err) => this.handleError(task, err),
      );
    } catch (e) {
      this.handleError(task, e);
    }
  }

  /**
   * @private
   * @ru Обрабатывает успешное завершение задачи.
   * @en Handles successful task resolution.
   * @param task - The executed queue node.
   * @param val - The resolution value.
   */
  private handleSuccess(task: QueueNode, val: unknown): void {
    this.running--;
    task.resolve(val);
    this.releaseNode(task);
    this.drain();
  }

  /**
   * @private
   * @ru Обрабатывает ошибку выполнения задачи.
   * @en Handles task execution rejection.
   * @param task - The failed queue node.
   * @param err - The encountered error.
   */
  private handleError(task: QueueNode, err: unknown): void {
    this.running--;
    task.reject(err);
    this.releaseNode(task);
    this.drain();
  }

  /**
   * @private
   * @ru Сбросывает ссылки в ноде и возвращает её в пул.
   * @en Clears node references and returns it to the allocation pool.
   * @param node - The queue node to release.
   */
  private releaseNode(node: QueueNode): void {
    node.executor = null!;
    node.resolve = null!;
    node.reject = null!;
    node.next = null;

    if (this.poolSize < this.maxPoolSize) {
      this.pool[this.poolSize++] = node;
    }
  }

  /**
   * @ru Количество задач, выполняемых в данный момент.
   * @en Number of tasks currently executing.
   */
  get activeCount(): number {
    return this.running;
  }

  /**
   * @ru Количество задач, ожидающих в очереди.
   * @en Number of tasks currently waiting in the queue.
   */
  get queuedCount(): number {
    return this.queued;
  }

  /**
   * @ru Общее количество активных и ожидающих задач.
   * @en Combined total of active and queued tasks.
   */
  get pending(): number {
    return this.running + this.queued;
  }

  /**
   * @ru Возвращает true, если в данный момент нет ни активных, ни ожидающих задач.
   * @en Returns true if there are no active running or pending tasks.
   */
  get isIdle(): boolean {
    return this.running === 0 && this.head === null;
  }

  /**
   * @ru Проверяет, есть ли свободные слоты для мгновенного выполнения задачи.
   * @en Evaluates if there is remaining capacity to process a task immediately.
   */
  get hasCapacity(): boolean {
    return this.running < this._maxConcurrent;
  }
}
