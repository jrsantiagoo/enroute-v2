"use client";

import { type HTMLAttributes } from "react";

// Outline placeholder that pulses until content is loaded
export default function Skeleton({
    className,
    ...rest
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            aria-hidden="true"
            className={`animate-skeleton rounded-lg bg-border ${className ?? ""}`}
            {...rest}
        />
    );
}
