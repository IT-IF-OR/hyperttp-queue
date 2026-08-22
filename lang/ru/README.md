# @hyperttp/queue

> [English](https://github.com/IT-IF-OR/hyperttp-queue) | Русский

Плагин очереди конкурентных запросов для Hyperttp.

## Возможности

- Управляет одновременным выполнением запросов в pipeline Core v2.
- Поддерживает protocol-neutral значения `SendRequest`, `UniversalResponse` и `RequestContext`.
- Защищает downstream-сервисы от резких всплесков запросов.

## Установка

```bash
npm install @hyperttp/queue
# или
bun add @hyperttp/queue
```

## Использование

```ts
import { HyperClient } from "hyperttp";
import { withQueue } from "@hyperttp/queue";

const client = new HyperClient({
  plugins: [withQueue()],
});
```

Настройки передаются через экспортируемый тип `QueueOptions`.

## Лицензия

MIT © dirold2
