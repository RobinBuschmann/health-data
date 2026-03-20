import { multi } from "../../common/inject/container.js";
import type { RequestDecorator } from "./request-decorator.js";

export const registerRequestDecorator = <TContainer>(
  factory: (container: TContainer) => RequestDecorator,
) => multi("requestDecorators", factory);
