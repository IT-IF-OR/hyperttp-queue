import type { QueueNode, Executor } from "../types/queue.js";

export class QueueManager {
  private running = 0;
  private queued = 0;

  private head: QueueNode | null = null;
  private tail: QueueNode | null = null;

  private _maxConcurrent: number;

  private pool: QueueNode[] = [];
  private poolSize = 0;
  private readonly maxPoolSize = 10000;

  constructor(maxConcurrent = 50) {
    this._maxConcurrent = Math.max(1, Math.floor(maxConcurrent));
  }

  get maxConcurrent(): number {
    return this._maxConcurrent;
  }

  set maxConcurrent(value: number) {
    this._maxConcurrent = Math.max(1, Math.floor(value));
    this.drain();
  }

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

  private handleSuccess(task: QueueNode, val: unknown): void {
    this.running--;
    task.resolve(val);
    this.releaseNode(task);
    this.drain();
  }

  private handleError(task: QueueNode, err: unknown): void {
    this.running--;
    task.reject(err);
    this.releaseNode(task);
    this.drain();
  }

  private releaseNode(node: QueueNode): void {
    node.executor = null!;
    node.resolve = null!;
    node.reject = null!;
    node.next = null;

    if (this.poolSize < this.maxPoolSize) {
      this.pool[this.poolSize++] = node;
    }
  }

  get activeCount(): number {
    return this.running;
  }

  get queuedCount(): number {
    return this.queued;
  }

  get pending(): number {
    return this.running + this.queued;
  }

  get isIdle(): boolean {
    return this.running === 0 && this.head === null;
  }

  get hasCapacity(): boolean {
    return this.running < this._maxConcurrent;
  }
}
