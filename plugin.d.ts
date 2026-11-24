import type { HyperPlugin } from "@hyperttp/types";
import type { QueueOptions } from "./types/queue.js";
declare module "@hyperttp/types" {
    interface HyperClientOptions {
        queue?: QueueOptions;
    }
}
export declare function withQueue(options?: QueueOptions): HyperPlugin;
//# sourceMappingURL=plugin.d.ts.map