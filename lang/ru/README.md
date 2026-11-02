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
  plugins: [withQueue({ maxConcurrent: 50 })],
});
```

Настройки передаются через экспортируемый тип `QueueOptions`.

- Передача настроек в `withQueue(...)` включает плагин, если не указано `enabled: false`. Для `withQueue()` без аргументов задайте `queue.enabled: true` в конфигурации клиента.
- Настройки `queue` клиента имеют приоритет над параметрами фабрики. Один только `queue.maxConcurrent` не включает плагин.
- `maxConcurrent` должен быть конечным числом; `NaN` и бесконечности вызывают `RangeError`. Конечные значения округляются вниз и ограничиваются минимумом в один слот. Лимит плагина по умолчанию — 500.
- Лимит действует отдельно для каждого `partitionKey`, а не глобально. Пустые партиции удаляются автоматически.
- Ожидание отменяется при отмене любого из сигналов: запроса или контекста. Объединение двух разных сигналов требует поддержки `AbortSignal.any` в среде выполнения (например, Node.js 20.3+).

## Лицензия

MIT © dirold2
