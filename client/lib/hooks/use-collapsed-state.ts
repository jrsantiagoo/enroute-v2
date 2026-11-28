import { useCallback, useSyncExternalStore } from "react";

// Used when localStorage is blocked (for example in private mode), so the toggle still works until the page is reloaded.
const memory = new Map<string, boolean>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
    listeners.add(listener);
    // Keeps other open tabs in sync.
    window.addEventListener("storage", listener);
    return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", listener);
    };
}

function read(storageKey: string): boolean {
    const remembered = memory.get(storageKey);
    if (remembered !== undefined) return remembered;
    try {
        return window.localStorage.getItem(storageKey) === "true";
    } catch {
        return false;
    }
}

function write(storageKey: string, collapsed: boolean) {
    try {
        window.localStorage.setItem(storageKey, String(collapsed));
        memory.delete(storageKey);
    } catch {
        memory.set(storageKey, collapsed);
    }
    listeners.forEach((listener) => listener());
}

// Remembers whether a panel is collapsed. It starts expanded on the server and on first paint, then follows the saved choice.
export function useCollapsedState(storageKey: string): [boolean, () => void] {
    const collapsed = useSyncExternalStore(
        subscribe,
        () => read(storageKey),
        () => false,
    );
    const toggle = useCallback(
        () => write(storageKey, !read(storageKey)),
        [storageKey],
    );
    return [collapsed, toggle];
}
