import { AsyncLocalStorage } from "node:async_hooks";

export const auditContext = new AsyncLocalStorage();
export const getActorId = () => auditContext.getStore()?.userId ?? null;
