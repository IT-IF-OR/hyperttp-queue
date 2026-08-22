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
  plugins: [withQueue()],
});
```

Configure the plugin with the exported `QueueOptions` type.

## License

MIT © dirold2
