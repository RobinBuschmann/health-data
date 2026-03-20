import { describe, expect, it, vi } from "vitest";
import { createContainer, createMulti, createProviders } from "./container.ts";

describe("createContainer", () => {
  describe("given factories with no dependencies", () => {
    it("should resolve the value when the key is accessed", () => {
      const container = createContainer({ greeting: () => "hello" });

      expect(container.greeting).toBe("hello");
    });
  });

  describe("given factories that depend on other values", () => {
    it("should inject resolved dependencies by name", () => {
      const { message } = createContainer({
        name: () => "world",
        message: ({ name }: { name: string }) => `hello ${name}`,
      });

      expect(message).toBe("hello world");
    });

    it("should resolve chained dependencies", () => {
      const { c } = createContainer({
        a: () => "A",
        b: ({ a }: { a: string }) => `${a}B`,
        c: ({ b }: { b: string }) => `${b}C`,
      });

      expect(c).toBe("ABC");
    });
  });

  describe("given a key that has not been accessed", () => {
    it("should not call the factory", () => {
      const factory = vi.fn(() => "value");
      createContainer({ value: factory });

      expect(factory).not.toHaveBeenCalled();
    });
  });

  describe("given a key accessed for the first time", () => {
    it("should call the factory once", () => {
      const factory = vi.fn(() => "value");
      const container = createContainer({ value: factory });
      void container.value;

      expect(factory).toHaveBeenCalledOnce();
    });
  });

  describe("given a key accessed multiple times", () => {
    it("should call the factory exactly once", () => {
      const factory = vi.fn(() => "value");
      const container = createContainer({ value: factory });
      void container.value;
      void container.value;
      void container.value;

      expect(factory).toHaveBeenCalledOnce();
    });

    it("should return the same instance on every access", () => {
      const container = createContainer({ obj: () => ({ x: 1 }) });

      expect(container.obj).toBe(container.obj);
    });
  });

  describe("given a self-referencing circular dependency", () => {
    it("should throw a circular dependency error", () => {
      const container = createContainer({
        a: ({ a }: { a: string }) => a,
      });

      expect(() => container.a).toThrow('Circular dependency detected "a" -> "a"');
    });
  });

  describe("given two mutually dependent factories", () => {
    it("should throw a circular dependency error", () => {
      const container = createContainer({
        a: ({ b }: { b: string }) => b,
        b: ({ a }: { a: string }) => a,
      });

      expect(() => container.a).toThrow('Circular dependency detected "a" -> "b" -> "a"');
    });
  });

  describe("given a circular dependency following a successful resolution", () => {
    it("should include all dependencies in the error chain", () => {
      // a depends on b (resolves fine) and d (circular back to a).
      // After b resolves, depChainKeys must still contain 'a' so the
      // error message reads "a" -> "d" -> "a" and not just "d" -> "a".
      const container = createContainer({
        a: ({ b, d }: { b: string; d: string }) => `${b}${d}`,
        b: () => "B",
        d: ({ a }: { a: string }) => a,
      });

      expect(() => container.a).toThrow('Circular dependency detected "a" -> "d" -> "a"');
    });
  });
});

describe("createMulti", () => {
  describe("given a key and factory with no explicit order", () => {
    it("should encode the key in @key:order:index format", () => {
      const multi = createMulti();
      const factory = () => "handler";
      const [key, value] = Object.entries(multi("handlers", factory))[0];

      expect(key).toMatch(/@handlers:0:/);
      expect(value).toEqual(factory);
    });
  });

  describe("given a key and factory with an explicit order", () => {
    it("should use the provided order in the encoded key", () => {
      const multi = createMulti();
      const factory = () => "handler";
      const [key, value] = Object.entries(multi("handlers", factory, 2))[0];

      expect(key).toMatch(/@handlers:2:/);
      expect(value).toEqual(factory);
    });
  });

  describe("given a single registration for a key", () => {
    it("should resolve to a one-element array via the base key", () => {
      const multi = createMulti();
      const container = createContainer({
        ...multi("handlers", () => "first"),
      });

      expect(container.handlers).toEqual(["first"]);
    });

    it("should inject the container into the factory", () => {
      const multi = createMulti();
      const container = createContainer({
        name: () => "world",
        ...multi("handlers", ({ name }: { name: string }) => `hello ${name}`),
      });

      expect(container.handlers).toEqual(["hello world"]);
    });
  });

  describe("given multiple registrations for the same key", () => {
    it("should aggregate them into a single array sorted by order", () => {
      const multi = createMulti();
      const container = createContainer({
        ...multi("handlers", () => "second", 1),
        ...multi("handlers", () => "first", 0),
      });

      expect(container.handlers).toEqual(["first", "second"]);
    });
  });

  describe("given two independent createMulti instances", () => {
    it("should maintain independent counters starting at zero", () => {
      const multiA = createMulti();
      const multiB = createMulti();
      const [keyA] = Object.keys(multiA("x", () => "a"));
      const [keyB] = Object.keys(multiB("x", () => "b"));

      expect(keyA).toMatch(/@x:0:0/);
      expect(keyB).toMatch(/@x:0:0/);
    });
  });
});

describe("createProviders", () => {
  describe("given any factories object", () => {
    it("should return the same reference unchanged", () => {
      const factories = { a: () => "A", b: () => "B" };

      expect(createProviders(factories)).toBe(factories);
    });
  });
});
