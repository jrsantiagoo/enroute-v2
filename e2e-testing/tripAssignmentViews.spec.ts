import { test } from "@playwright/test";

// Script 09 — Trip Assignment: Table & Driver Views. Covers table-view.tsx and
// driver-view.tsx, neither of which assignmentForm.spec.ts exercises (that file only
// drives the create-trip modal). All cases below are blocked by sprint-2 design gaps —
// see docs/qa/sw-design-defect-report.md DD-16..DD-19.

test.describe("Trip Assignment — Table & Driver Views", () => {

    // Blocked: DD-16/RMS-91 — the Fuel Consumed column cell is a hardcoded "—".
    test.fixme("9-1 the Fuel Consumed column reflects real per-trip fuel data", async () => {});

    // Blocked: DD-17/RMS-92 — Driver Capacity status is a static mock field, not derived
    // from activeHours.
    test.fixme("9-2 the Driver Capacity status reflects a computed utilization percentage", async () => {});

    // Blocked: DD-18/RMS-111 — no urgency/time-remaining sort key exists.
    test.fixme("9-3 the assignment table supports sorting by urgency or time remaining", async () => {});

    // Blocked: DD-19/RMS-112 — no "Ongoing" status value exists anywhere in the status model.
    test.fixme("9-4 an Ongoing status renders with its own badge styling", async () => {});
});
