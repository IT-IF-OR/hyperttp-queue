import type { HyperPlugin } from "@hyperttp/types";
declare module "@hyperttp/types" {
    interface HyperttpPluginsExtension {
        queue?: {
            enabled?: boolean;
        };
    }
}
export declare function withQueue(): HyperPlugin;
//# sourceMappingURL=plugin%20copy.d.ts.map