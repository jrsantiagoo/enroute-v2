import jsPDF from "jspdf";

const C = {
    foreground: [23, 23, 23] as [number, number, number],
    mutedForeground: [107, 114, 128] as [number, number, number],
    border: [217, 223, 229] as [number, number, number],
    card: [255, 255, 255] as [number, number, number],
    background: [246, 249, 252] as [number, number, number],
    primaryForeground: [0, 86, 164] as [number, number, number],
};

function drawStatCard(
    doc: jsPDF,
    title: string,
    value: string,
    x: number,
    y: number,
    w: number,
    h: number,
) {
    doc.setFillColor(...C.card);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).roundedRect(x, y, w, h, 2, 2, "F");
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.4);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).roundedRect(x, y, w, h, 2, 2, "S");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.mutedForeground);
    doc.setFont("helvetica", "normal");
    doc.text(title, x + w / 2, y + 8, { align: "center" });
    doc.setFontSize(15);
    doc.setTextColor(...C.foreground);
    doc.setFont("helvetica", "bold");
    doc.text(value, x + w / 2, y + h - 5, { align: "center" });
    doc.setFont("helvetica", "normal");
}

interface ChartItem {
    day: string;
    distance?: number;
    fuel?: number;
    trend: number;
    prevTrend?: number;
}

function drawBarChart(
    doc: jsPDF,
    items: ChartItem[],
    yKey: "distance" | "fuel",
    label: string,
    barColor: [number, number, number],
    trendColor: [number, number, number],
    x: number,
    y: number,
    w: number,
    h: number,
) {
    const values = items.map((d) => Number(d[yKey]) || 0);
    const maxVal = Math.max(...values, 1);

    const padL = 14;
    const padB = 8;
    const padT = 4;

    const plotL = x + padL;
    const plotR = x + w;
    const plotT = y + padT;
    const plotB = y + h - padB;

    const plotW = plotR - plotL;
    const plotH = plotB - plotT;

    // Chart label
    doc.setFontSize(7);
    doc.setTextColor(...C.foreground);
    doc.text(label, x, y - 2);

    // Axes
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.line(plotL, plotB, plotR, plotB);
    doc.line(plotL, plotT, plotL, plotB);

    // Y-axis ticks and labels
    doc.setFontSize(5);
    doc.setTextColor(...C.mutedForeground);
    const tickSteps = [0, 0.25, 0.5, 0.75, 1];
    tickSteps.forEach((t) => {
        const yPos = plotB - t * plotH;
        doc.text(
            String(Math.round(maxVal * t * 10) / 10),
            plotL - 2,
            yPos + 1.5,
            {
                align: "right",
            },
        );
        doc.line(plotL - 2, yPos, plotL, yPos);
    });

    // Bar dimensions
    const barCount = items.length;
    const totalBarArea = plotW / barCount;
    const barWidth = Math.max(totalBarArea * 0.6, 3);
    const barGap = totalBarArea - barWidth;

    // Draw bars
    doc.setFillColor(...barColor);
    items.forEach((d, i) => {
        const barH = ((Number(d[yKey]) || 0) / maxVal) * plotH;
        const bx = plotL + i * totalBarArea + barGap / 2;
        const by = plotB - barH;
        const radius = Math.min(1.5, barWidth / 3);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (doc as any).roundedRect(bx, by, barWidth, barH, radius, radius, "F");
    });

    // Helper: draw a trend line from a data key
    function drawTrendLine(
        key: "trend" | "prevTrend",
        color: [number, number, number],
        dash?: number[],
    ) {
        const pts: { x: number; y: number }[] = [];
        items.forEach((d, i) => {
            const val = Number(d[key]);
            if (isNaN(val)) return; // no data this day – leave a gap
            pts.push({
                x: plotL + (i + 0.5) * (plotW / items.length),
                y: plotB - (val / maxVal) * plotH,
            });
        });

        doc.setDrawColor(...color);
        doc.setLineWidth(0.8);
        if (dash) doc.setLineDashPattern(dash, 0);
        for (let i = 1; i < pts.length; i++) {
            doc.line(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
        }
        doc.setLineDashPattern([], 0);
    }

    // Current trend line
    drawTrendLine("trend", trendColor);

    // Comparison trend line
    if (items[0]?.prevTrend !== undefined) {
        drawTrendLine("prevTrend", [148, 163, 184], [3, 2]);
    }

    // X-axis labels
    doc.setFontSize(5);
    doc.setTextColor(...C.mutedForeground);
    items.forEach((d, i) => {
        const px = plotL + (i + 0.5) * (plotW / items.length);
        doc.text(d.day, px, plotB + 4, { align: "center" });
    });
}

export function generatePDF(
    totalTrips: number,
    efficiency: number,
    delivered: number,
    distanceData: ChartItem[],
    fuelData: ChartItem[],
) {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    const doc = new jsPDF();

    // ── Header ──────────────────────────────────────────────────────────

    doc.setFillColor(...C.background);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).rect(0, 0, 210, 28, "F");

    doc.setFontSize(18);
    doc.setTextColor(...C.primaryForeground);
    doc.setFont("helvetica", "bold");
    doc.text("Route Management Report", 14, 14);

    doc.setFontSize(8);
    doc.setTextColor(...C.mutedForeground);
    doc.setFont("helvetica", "normal");
    doc.text(`generated on ${dateStr} at ${timeStr}`, 14, 22);

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.5);
    doc.line(14, 30, 196, 30);

    // ── Key Statistics ──────────────────────────────────────────────────

    doc.setFontSize(12);
    doc.setTextColor(...C.foreground);
    doc.setFont("helvetica", "bold");
    doc.text("Key Statistics", 14, 40);

    const cardH = 20;
    const cardGap = 6;

    const statsY = 46;
    const cardW = (182 - 2 * cardGap) / 3;
    const rowOffset = (210 - (3 * cardW + 2 * cardGap)) / 2;
    const stats = [
        { title: "Total Successful Trips", value: String(totalTrips) },
        { title: "Efficiency", value: `${efficiency} km/L` },
        { title: "Delivered Orders", value: String(delivered) },
    ];
    stats.forEach((stat, i) => {
        drawStatCard(
            doc,
            stat.title,
            stat.value,
            rowOffset + i * (cardW + cardGap),
            statsY,
            cardW,
            cardH,
        );
    });

    // ── Charts ──────────────────────────────────────────────────────────

    const chartsTop = statsY + cardH + 24;

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.5);
    doc.line(14, chartsTop - 8, 196, chartsTop - 8);

    doc.setFontSize(12);
    doc.setTextColor(...C.foreground);
    doc.setFont("helvetica", "bold");
    doc.text("Statistics", 14, chartsTop);

    const chartW = 85;
    const chartH = 45;
    const colGap = 8;
    const chartY = chartsTop + 6;

    drawBarChart(
        doc,
        distanceData,
        "distance",
        "Average Distance per Order (km)",
        [59, 130, 246],
        [245, 158, 11],
        14,
        chartY,
        chartW,
        chartH,
    );

    drawBarChart(
        doc,
        fuelData,
        "fuel",
        "Average Fuel Usage per Order (L)",
        [245, 158, 11],
        [59, 130, 246],
        14 + chartW + colGap,
        chartY,
        chartW,
        chartH,
    );

    const filename = `Route Management Dashboard - ${dateStr}.pdf`;
    doc.save(filename);
}
