export class QueueManager {
    running = 0;
    _maxConcurrent;
    waiters = [];
    constructor(maxConcurrent = 50) {
        this._maxConcurrent = Math.max(1, Math.floor(maxConcurrent));
    }
    acquire(signal) {
        if (signal?.aborted) {
            return Promise.reject(new DOMException("The user aborted a request.", "AbortError"));
        }
        if (this.running < this._maxConcurrent) {
            this.running++;
            return Promise.resolve(() => this.release());
        }
        return new Promise((resolve, reject) => {
            const waiter = { resolve, reject };
            this.waiters.push(waiter);
            const onAbort = () => {
                const idx = this.waiters.indexOf(waiter);
                if (idx >= 0)
                    this.waiters.splice(idx, 1);
                reject(new DOMException("The user aborted a request.", "AbortError"));
            };
            signal?.addEventListener("abort", onAbort, { once: true });
        });
    }
    release() {
        this.running--;
        const waiter = this.waiters.shift();
        if (waiter) {
            this.running++;
            waiter.resolve(() => this.release());
        }
    }
    get activeCount() {
        return this.running;
    }
    get queuedCount() {
        return this.waiters.length;
    }
}
//# sourceMappingURL=QueueManager2.js.map