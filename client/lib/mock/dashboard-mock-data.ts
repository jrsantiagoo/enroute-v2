// Hardcoded Data for visualization purposes
export const dailyDistanceData = [
    { day: "Mon", distance: 12.4 },
    { day: "Tue", distance: 15.8 },
    { day: "Wed", distance: 11.2 },
    { day: "Thu", distance: 18.5 },
    { day: "Fri", distance: 14.1 },
    { day: "Sat", distance: 9.7 },
    { day: "Sun", distance: 10.3 },
];

export const dailyFuelData = [
    { day: "Mon", fuel: 8.2 },
    { day: "Tue", fuel: 10.5 },
    { day: "Wed", fuel: 7.1 },
    { day: "Thu", fuel: 12.3 },
    { day: "Fri", fuel: 9.6 },
    { day: "Sat", fuel: 6.4 },
    { day: "Sun", fuel: 7.8 },
];

// Derived weekly data (from daily averages)
export const weeklyDistanceData = [
    {
        week: "W1",
        distance: +(
            dailyDistanceData.reduce((s, d) => s + d.distance, 0) * 1.0
        ).toFixed(1),
    },
    {
        week: "W2",
        distance: +(
            dailyDistanceData.reduce((s, d) => s + d.distance, 0) * 1.08
        ).toFixed(1),
    },
    {
        week: "W3",
        distance: +(
            dailyDistanceData.reduce((s, d) => s + d.distance, 0) * 0.93
        ).toFixed(1),
    },
    {
        week: "W4",
        distance: +(
            dailyDistanceData.reduce((s, d) => s + d.distance, 0) * 1.15
        ).toFixed(1),
    },
];

export const weeklyFuelData = [
    {
        week: "W1",
        fuel: +(dailyFuelData.reduce((s, d) => s + d.fuel, 0) * 1.0).toFixed(1),
    },
    {
        week: "W2",
        fuel: +(dailyFuelData.reduce((s, d) => s + d.fuel, 0) * 1.07).toFixed(
            1,
        ),
    },
    {
        week: "W3",
        fuel: +(dailyFuelData.reduce((s, d) => s + d.fuel, 0) * 0.91).toFixed(
            1,
        ),
    },
    {
        week: "W4",
        fuel: +(dailyFuelData.reduce((s, d) => s + d.fuel, 0) * 1.12).toFixed(
            1,
        ),
    },
];

export interface Order {
    id: string;
    client: string;
    destination: string;
    orderedOn: string;
    deliverBy: string;
    packageContent: string;
    packageSize: string;
    packageWeight: string;
}

export const orders: Order[] = [
    {
        id: "ORD-1001",
        client: "Acme Corp",
        destination: "New York, NY",
        orderedOn: "2026-06-01",
        deliverBy: "2026-06-05",
        packageContent: "Electronics",
        packageSize: "40×30×20 cm",
        packageWeight: "2.5 kg",
    },
    {
        id: "ORD-1002",
        client: "Globex Inc",
        destination: "Los Angeles, CA",
        orderedOn: "2026-06-01",
        deliverBy: "2026-06-06",
        packageContent: "Clothing",
        packageSize: "60×40×30 cm",
        packageWeight: "5.0 kg",
    },
    {
        id: "ORD-1003",
        client: "Initech",
        destination: "Chicago, IL",
        orderedOn: "2026-06-02",
        deliverBy: "2026-06-07",
        packageContent: "Books",
        packageSize: "30×25×15 cm",
        packageWeight: "3.2 kg",
    },
    {
        id: "ORD-1004",
        client: "Hooli",
        destination: "San Francisco, CA",
        orderedOn: "2026-06-02",
        deliverBy: "2026-06-08",
        packageContent: "Server Parts",
        packageSize: "80×60×40 cm",
        packageWeight: "15.0 kg",
    },
    {
        id: "ORD-1005",
        client: "Umbrella Corp",
        destination: "Houston, TX",
        orderedOn: "2026-06-03",
        deliverBy: "2026-06-09",
        packageContent: "Medical Supplies",
        packageSize: "50×40×30 cm",
        packageWeight: "8.0 kg",
    },
    {
        id: "ORD-1006",
        client: "Stark Industries",
        destination: "Boston, MA",
        orderedOn: "2026-06-03",
        deliverBy: "2026-06-10",
        packageContent: "Prototype Parts",
        packageSize: "70×50×40 cm",
        packageWeight: "12.5 kg",
    },
    {
        id: "ORD-1007",
        client: "Wayne Enterprises",
        destination: "Gotham, NJ",
        orderedOn: "2026-06-04",
        deliverBy: "2026-06-11",
        packageContent: "Automotive Parts",
        packageSize: "100×60×50 cm",
        packageWeight: "22.0 kg",
    },
    {
        id: "ORD-1008",
        client: "Oscorp",
        destination: "Seattle, WA",
        orderedOn: "2026-06-04",
        deliverBy: "2026-06-12",
        packageContent: "Lab Equipment",
        packageSize: "60×40×40 cm",
        packageWeight: "18.0 kg",
    },
    {
        id: "ORD-1009",
        client: "Cyberdyne Systems",
        destination: "Denver, CO",
        orderedOn: "2026-06-05",
        deliverBy: "2026-06-13",
        packageContent: "Circuit Boards",
        packageSize: "35×25×10 cm",
        packageWeight: "1.8 kg",
    },
    {
        id: "ORD-1010",
        client: "Soylent Corp",
        destination: "Miami, FL",
        orderedOn: "2026-06-05",
        deliverBy: "2026-06-14",
        packageContent: "Food Products",
        packageSize: "50×40×30 cm",
        packageWeight: "10.0 kg",
    },
];
