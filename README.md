# @hyperttp/queue

> English | [Русский](https://github.com/IT-IF-OR/hyperttp-queue/tree/main/lang/ru)

Concurrency queue plugin for Hyperttp.

## Features

- Controls concurrent request execution in the Core v2 pipeline.
- Supports protocol-neutral `SendRequest`, `UniversalResponse`, and `RequestContext` values.
- Helps protect downstream services from request bursts.

## Installation

```bash
npm install @hyperttp/queue
# or
bun add @hyperttp/queue
```

## Usage

```ts
import { HyperClient } from "hyperttp";
import { withQueue } from "@hyperttp/queue";

const client = new HyperClient({
  plugins: [withQueue({ maxConcurrent: 50 })],
});
```

Configure the plugin with the exported `QueueOptions` type.

- Passing options to `withQueue(...)` enables the plugin unless `enabled: false` is set. With `withQueue()` without arguments, set `queue.enabled: true` in the client configuration.
- Client `queue` settings override factory options. Setting only `queue.maxConcurrent` does not enable the plugin.
- `maxConcurrent` must be finite; `NaN` and infinities throw `RangeError`. Finite values are rounded down and clamped to at least one. The default plugin limit is 500.
- The limit applies separately to each `partitionKey`, not globally. Idle partitions are removed automatically.
- Waiting is cancelled when either the request signal or the context signal aborts. Combining two distinct signals requires runtime support for `AbortSignal.any` (for example, Node.js 20.3+).

## License

MIT © dirold2
