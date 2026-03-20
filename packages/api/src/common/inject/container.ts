export type Providers<TContainer> = {
  [K in keyof TContainer]: Factory<TContainer>;
};
export type Factory<TContainer> = (container: TContainer) => unknown;
export type Container<T extends Providers<Container<T>>> = {
  [P in keyof T]: ReturnType<T[P]>;
};
type MissingProviders<TProviders extends Record<string, (container: never) => unknown>> = Exclude<
  {
    [K in keyof TProviders]: TProviders[K] extends (container: infer C) => unknown
      ? keyof C & string
      : never;
  }[keyof TProviders],
  keyof TProviders & string
>;

export const createProviders = <TProviders extends Record<string, (container: never) => unknown>>(
  factories: [MissingProviders<TProviders>] extends [never]
    ? TProviders
    : `Missing provider: "${MissingProviders<TProviders>}"`,
): TProviders => factories as TProviders;

export const createMulti = () => {
  let index = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <TKey extends string, TFactory extends Factory<any>>(
    key: TKey,
    factory: TFactory,
    order = 0,
  ) =>
    ({
      [`@${String(key)}:${order}:${index++}`]: factory,
    }) as unknown as {
      [K in TKey as K]: (...args: Parameters<TFactory>) => Array<ReturnType<TFactory>>;
    };
};
export const multi = createMulti();

export const createContainer = <TProviders extends Providers<Container<TProviders>>>(
  factories: TProviders,
): Container<TProviders> => {
  const cache: Record<string, unknown> = {};
  const circularDepIndicator: { [key: string]: boolean } = {};
  const depChainKeys: string[] = [];
  const multiKeys = Object.keys(factories)
    .filter((key) => key.startsWith("@"))
    .sort()
    .reduce(
      (acc, key) => {
        const requestingKey = key.slice(1, key.indexOf(":"));
        return {
          ...acc,
          [requestingKey]: [...(acc[requestingKey] ?? []), factories[key as keyof TProviders]],
        };
      },
      {} as Record<string, Array<Factory<Container<TProviders>>>>,
    );
  const container = new Proxy(factories, {
    get(_, key: string) {
      if (!(key in cache) && (key in factories || key in multiKeys)) {
        depChainKeys.push(String(key));
        if (circularDepIndicator[key]) {
          throw new Error(
            `Circular dependency detected ${depChainKeys.map((key) => `"${key}"`).join(" -> ")}`,
          );
        }
        circularDepIndicator[key] = true;
        cache[key] =
          key in multiKeys
            ? multiKeys[key].map((factory) => factory(container))
            : factories[key as keyof TProviders](container);
        depChainKeys.pop();
      }
      return cache[key];
    },
  }) as Container<TProviders>;
  return container;
};
