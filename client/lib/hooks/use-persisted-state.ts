import { useEffect, useState } from "react";

// Hook that preserves state value in localStorage so it survives page reloads
// Used to maintain collapsed sidebar
export function usePersistedState<T>(key: string, defaultValue: T) {
    const [state, setState] = useState<T>(defaultValue);
    const [ready, setReady] = useState(false);

    // Gets stored value
    useEffect(() => {
        const saved = localStorage.getItem(key);
        if (saved) setState(JSON.parse(saved));
        setReady(true);
    }, [key]);

    // Updates stored value if state changes
    useEffect(() => {
        if (!ready) return;
        localStorage.setItem(key, JSON.stringify(state));
    }, [key, state, ready]);

    return [state, setState, ready] as const;
}
