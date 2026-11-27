// Previous holds the severity and metric stored at dismissal; current is the notification as it stands now.
export function isMaterialChange(previous, current, percentThreshold) {
    if (previous.severity !== current.severity) return true;
    if (previous.metric == null || current.metric == null) return false;

    const delta = Math.abs(current.metric - previous.metric);
    const needed = Math.max(
        (Math.abs(previous.metric) * percentThreshold) / 100,
        current.metricStep ?? 0,
    );
    return delta >= needed;
}
