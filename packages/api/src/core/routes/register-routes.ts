import { multi } from "../../common/inject/container.js";
import type { Route } from "./route.js";

export const registerRoutes = <TContainer>(factory: (container: TContainer) => Route) =>
  multi("routes", factory);
