export interface QueueOptions {
  /**
   * @ru Включить очередь запросов
   * @en Enable request queue
   */
  enabled?: boolean;
}

export type Executor<T> = () => Promise<T>;

export interface QueueNode {
  executor: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  next: QueueNode | null;
}

export type Scheduler = (cb: () => void) => void;
