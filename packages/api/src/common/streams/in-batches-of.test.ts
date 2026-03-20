import { expect, it } from "vitest";
import { inBatchesOf } from "./in-batches-of.js";

async function collect<T>(gen: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of gen) result.push(item);
  return result;
}

async function* from<T>(...items: T[]): AsyncGenerator<T> {
  for (const item of items) yield item;
}

it("groups items into batches of the given size", async () => {
  const batches = await collect(inBatchesOf(from(1, 2, 3, 4, 5, 6), 2));
  expect(batches).toEqual([
    [1, 2],
    [3, 4],
    [5, 6],
  ]);
});

it("yields a partial batch for remaining items", async () => {
  const batches = await collect(inBatchesOf(from(1, 2, 3), 2));
  expect(batches).toEqual([[1, 2], [3]]);
});

it("yields a single batch when item count is less than size", async () => {
  const batches = await collect(inBatchesOf(from(1, 2), 10));
  expect(batches).toEqual([[1, 2]]);
});

it("yields a single batch when item count equals size", async () => {
  const batches = await collect(inBatchesOf(from(1, 2, 3), 3));
  expect(batches).toEqual([[1, 2, 3]]);
});

it("yields nothing for an empty source", async () => {
  const batches = await collect(inBatchesOf(from(), 5));
  expect(batches).toEqual([]);
});
