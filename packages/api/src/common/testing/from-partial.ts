import { RecursivePartial } from "../types/recursive-partial.ts";

export const fromPartial = <T>(data: RecursivePartial<T>): T => data as unknown as T;
