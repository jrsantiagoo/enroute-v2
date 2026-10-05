import { useState, useMemo } from "react";

export interface SortState {
    key: string;
    dir: "asc" | "desc";
}

// Given a data array and a getValue accessor, returns a sorted copy
// with a toggle(key) function to set or flip the sort column.
// Used for sorting table columns by ascending/descending
export function useSort<T>(
    data: T[],
    getValue: (item: T, key: string) => string,
) {
    const [state, setState] = useState<SortState | null>(null);

    const sorted = useMemo(() => {
        if (!state) return data;
        return [...data].sort((a, b) => {
            const aVal = getValue(a, state.key);
            const bVal = getValue(b, state.key);
            const cmp =
                typeof aVal === "number" && typeof bVal === "number"
                    ? aVal - bVal
                    : String(aVal ?? "").localeCompare(String(bVal ?? ""));
            return state.dir === "asc" ? cmp : -cmp;
        });
    }, [data, state, getValue]);

    // Click cycle: null → asc → desc → null
    const toggle = (key: string) => {
        setState((prev) => {
            if (prev?.key !== key) return { key, dir: "asc" };
            if (prev.dir === "asc") return { key, dir: "desc" };
            return null; // third click → back to unsorted
        });
    };

    return { sorted, state, toggle };
}
