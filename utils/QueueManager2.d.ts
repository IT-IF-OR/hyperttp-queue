type Release = () => void;
export declare class QueueManager {
    private running;
    private readonly _maxConcurrent;
    private readonly waiters;
    constructor(maxConcurrent?: number);
    acquire(signal?: AbortSignal): Promise<Release>;
    private release;
    get activeCount(): number;
    get queuedCount(): number;
}
export {};
//# sourceMappingURL=QueueManager2.d.ts.map