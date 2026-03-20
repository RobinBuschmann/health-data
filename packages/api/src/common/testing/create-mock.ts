import { vi, Mock, Mocked } from "vitest";

export const createMock = <T>() => {
  const cache = new Map<string | symbol, Mock>();
  return new Proxy(
    {},
    {
      get: (_, name) => {
        if (name === "mockClear") {
          return () => cache.clear();
        }
        if (!cache.has(name)) {
          cache.set(name, vi.fn().mockName(`${String(name)}`));
        }
        return cache.get(name);
      },
    },
  ) as Mocked<T> & { mockClear(): void };
};
