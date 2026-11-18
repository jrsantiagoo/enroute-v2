const SEVERITY_RANK = { high: 0, medium: 1, info: 2 };

export const bySeverity = (a, b) =>
    SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];

// Metric and metricStep let the service decide whether a dismissed notification changed enough to return.
// Suggestions are advice only. A suggestion may point at a page via target, but nothing is ever done automatically.
export function makeNotification(fields) {
    return { metric: null, metricStep: null, suggestions: [], ...fields };
}
