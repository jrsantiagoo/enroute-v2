// ─────────────────────────────────────────────────────────────────────────────
// LOCALSTORAGE HANDLING
// Single source of truth for saved-route persistence. Every read/write goes
// through this module so the UI never touches localStorage directly — swapping
// this for API calls later means changing only this file.
// ─────────────────────────────────────────────────────────────────────────────

import { RoutePlan } from "../types/schema";

const STORAGE_KEY = "acesoft_savedRoutes";

// ── Reads ───────────────────────────────────────────────────────────────────

export function loadSavedRoutes(): RoutePlan[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as RoutePlan[]) : [];
    } catch {
        return [];
    }
}

// Case-insensitive, trimmed check against saved route names. `excludeId` lets an
// existing route keep its own name when being re-saved.
export function isRouteNameTaken(name: string, excludeId?: string): boolean {
    const target = name.trim().toLowerCase();
    return loadSavedRoutes().some(
        (r) => r.id_ !== excludeId && r.name.trim().toLowerCase() === target,
    );
}

// ── Writes ──────────────────────────────────────────────────────────────────

export function saveRoute(plan: RoutePlan): void {
    if (typeof window === "undefined") return;
    try {
        const all = loadSavedRoutes();
        const idx = all.findIndex((r) => r.id_ === plan.id_);
        if (idx >= 0) {
            all[idx] = plan;
        } else {
            all.push(plan);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
        console.error("acesoft: failed to write to localStorage");
    }
}

export function deleteRoute(id: string): void {
    if (typeof window === "undefined") return;
    const remaining = loadSavedRoutes().filter((r) => r.id_ !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
}

// Archiving stamps `archivedAt` so the Archived tab can show a "Date Archived"
// column; restoring clears it so a re-archived route gets a fresh timestamp.
export function setRouteArchived(id: string, archived: boolean): void {
    if (typeof window === "undefined") return;
    const all = loadSavedRoutes().map((r) =>
        r.id_ === id
            ? {
                  ...r,
                  archived,
                  archivedAt: archived ? new Date().toISOString() : undefined,
              }
            : r,
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
