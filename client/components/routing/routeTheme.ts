// Dark-mode palette for the routing UI. Applied only when theme === "dark";
// light mode keeps each component's own colors.
export const DARK = {
    // Surfaces
    panelBg: "#0d1b2e", // Route Plan panel / popover / modal body (midnight-blue)
    toolbarBg: "var(--background)", // toolbar bar (slightly deeper navy)
    elevatedBg: "#0f2237", // inputs, selects, nested cards
    panelBorder: "#1e3a5f", // subtle lighter-navy separators
    divider: "#16273d", // faint inner dividers

    // Text
    text: "#e5edf5", // primary text
    textMuted: "#94a3b8", // distance/duration, addresses, secondary text

    // Buttons — navy bg + bright blue text
    btnBg: "#0c2a45",
    btnText: "var(--foreground)",
    btnBorder: "#1e466e",
    btnHover: "#103a5f",
    btnActiveBg: "#11456f", // active/toggled button — slightly brighter

    // Stop role boxes — muted, not bright. Badge colors stay as in light mode.
    startBg: "rgba(34,197,94,0.12)",
    startBorder: "rgba(34,197,94,0.35)",
    midBg: "rgba(37,99,235,0.14)",
    midBorder: "rgba(37,99,235,0.32)",
    endBg: "rgba(239,68,68,0.12)",
    endBorder: "rgba(239,68,68,0.35)",

    // "+ Add a stop…" affordance
    addBg: "rgba(255,255,255,0.03)",
    addBorder: "#2a3f5a",

    // Interactive
    rowHover: "#16273d",
    connector: "#2a3f5a", // segment connector line between stops
    accent: "#2da8ff", // links / accent text (e.g. geo-search footer)
    accentHover: "rgba(45,168,255,0.12)",
} as const;
