// import { orders } from "@/lib/dashboard/mockData";
import type { Order } from "@/lib/types/schema";
import {
    CalendarClock,
    MapPinned,
    Package,
    PackageSearch,
    Search,
    User,
    ListOrdered,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useSort } from "@/lib/hooks/useSort";
import SortableHeader from "@/components/ui/sortable-header";
import FilterSelect from "../ui/filter-select";
import StatusBadge from "../ui/status-badge";

interface OrderTableProps {
    orders: Order[];
}

// Orders Table Component with search functionality
export default function OrdersTable({ orders }: OrderTableProps) {
    const [search, setSearch] = useState("");
    const [clientFilter, setClientFilter] = useState("All");
    const [destinationFilter, setDestinationFilter] = useState("All");
    const [contentFilter, setContentFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");

    const clients = [...new Set(orders.map((o) => o.client))];
    const destinations = [
        ...new Set(
            orders
                .map((o) => o.destination)
                .filter((d): d is string => d !== undefined),
        ),
    ];
    const contents = [
        ...new Set(
            orders
                .map((o) => o.package_content)
                .filter((c): c is string => c !== undefined),
        ),
    ];
    const statuses = [...new Set(orders.map((o) => o.status))];

    const filtered = orders.filter((o) => {
        const matchesSearch =
            search === "" ||
            o.order_id.toLowerCase().includes(search.toLowerCase()) ||
            o.client.toLowerCase().includes(search.toLowerCase()) ||
            (o.destination ?? "")
                .toLowerCase()
                .includes(search.toLowerCase()) ||
            (o.package_content ?? "")
                .toLowerCase()
                .includes(search.toLowerCase()) ||
            o.status.toLowerCase().includes(search.toLowerCase());

        const matchesClient =
            clientFilter === "All" || o.client === clientFilter;
        const matchesDestination =
            destinationFilter === "All" || o.destination === destinationFilter;
        const matchesContent =
            contentFilter === "All" || o.package_content === contentFilter;
        const matchesStatus =
            statusFilter === "All" || o.status === statusFilter;

        return (
            matchesSearch &&
            matchesClient &&
            matchesDestination &&
            matchesContent &&
            matchesStatus
        );
    });

    // Sort orders by the currently active column
    const getOrderVal = useCallback((o: Order, key: string) => {
        switch (key) {
            case "id":
                return o.order_id;
            case "client":
                return o.client;
            case "destination":
                return o.destination ?? "";
            case "dateOrdered":
                return o.ordered_on;
            case "deliverBy":
                return o.delivered_by ?? "";
            case "packageContent":
                return o.package_content ?? "";
            case "packageSize":
                return o.package_size ?? "";
            case "packageWeight":
                return o.package_weight ?? "";
            case "status":
                return o.status ?? "";
            default:
                return "";
        }
    }, []);
    const {
        sorted: sortedOrders,
        state: sortState,
        toggle: toggleSort,
    } = useSort(filtered, getOrderVal);

    return (
        <div className="rounded-xl bg-card p-6 shadow-lg shadow-primary border border-card-border">
            {/* Header + search */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex -mt-4 items-center gap-2 text-base font-semibold">
                    <ListOrdered
                        size={21}
                        className="text-primary-foreground"
                    />
                    <h3 className="text-base font-semibold text-foreground">
                        Orders
                    </h3>
                </div>

                {/* Filtered Search */}
                <div className="relative">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                        type="text"
                        placeholder="Search orders…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-64 rounded-lg border border-card-border pl-8 pr-4 py-1.5 text-sm text-foreground 
                        outline-none transition focus:border-primary-foreground dark:bg-card placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            {/* Filter Options */}
            <div className="-mt-4 mb-3 flex flex-wrap gap-2">
                <FilterSelect
                    label="All Clients"
                    value={clientFilter}
                    options={clients}
                    onChange={setClientFilter}
                />
                <FilterSelect
                    label="All Destinations"
                    value={destinationFilter}
                    options={destinations}
                    onChange={setDestinationFilter}
                />
                <FilterSelect
                    label="All Contents"
                    value={contentFilter}
                    options={contents}
                    onChange={setContentFilter}
                />
                <FilterSelect
                    label="All Statuses"
                    value={statusFilter}
                    options={statuses}
                    onChange={setStatusFilter}
                />
            </div>

            {/* Scrollable table */}
            <div className="overflow-auto max-h-96 rounded-lg scrollbar-thumb-muted-foreground">
                <table className="w-full text-left text-sm border-separate border-spacing-0 whitespace-nowrap">
                    <thead className="sticky top-0 bg-card">
                        <tr>
                            <SortableHeader
                                sortKey="id"
                                sortState={sortState}
                                onToggle={toggleSort}
                                className="bg-card rounded-tl-lg"
                            >
                                <Package
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Order ID
                            </SortableHeader>
                            <SortableHeader
                                sortKey="client"
                                sortState={sortState}
                                onToggle={toggleSort}
                                className="bg-card"
                            >
                                <User
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Client
                            </SortableHeader>
                            <SortableHeader
                                sortKey="destination"
                                sortState={sortState}
                                onToggle={toggleSort}
                                className="bg-card"
                            >
                                <MapPinned
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Destination
                            </SortableHeader>
                            <SortableHeader
                                sortKey="dateOrdered"
                                sortState={sortState}
                                onToggle={toggleSort}
                                className="bg-card"
                            >
                                <CalendarClock
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Date Ordered
                            </SortableHeader>
                            <SortableHeader
                                sortKey="deliverBy"
                                sortState={sortState}
                                onToggle={toggleSort}
                                className="bg-card"
                            >
                                <CalendarClock
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Deliver By
                            </SortableHeader>
                            <SortableHeader
                                sortKey="packageContent"
                                sortState={sortState}
                                onToggle={toggleSort}
                                className="bg-card"
                            >
                                <PackageSearch
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Package Content
                            </SortableHeader>
                            <SortableHeader
                                sortKey="packageSize"
                                sortState={sortState}
                                onToggle={toggleSort}
                                className="bg-card"
                            >
                                Package Size
                            </SortableHeader>
                            <SortableHeader
                                sortKey="packageWeight"
                                sortState={sortState}
                                onToggle={toggleSort}
                                className="bg-card rounded-tr-lg"
                            >
                                Package Weight
                            </SortableHeader>
                            <SortableHeader
                                sortKey="status"
                                sortState={sortState}
                                onToggle={toggleSort}
                                className="bg-card rounded-tr-lg"
                            >
                                Status
                            </SortableHeader>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedOrders.map((o) => (
                            <tr
                                key={o.id_}
                                className="border-t border-border text-foreground transition hover:bg-muted-foreground/15"
                            >
                                <td className="px-3 py-2 font-medium ">
                                    {o.order_id}
                                </td>
                                <td className="px-3 py-2 ">{o.client}</td>
                                <td className="px-3 py-2 ">
                                    {o.destination || "—"}
                                </td>
                                <td className="px-3 py-2 ">
                                    {
                                        new Date(o.ordered_on)
                                            .toISOString()
                                            .split("T")[0]
                                    }
                                </td>
                                <td className="px-3 py-2 ">
                                    {o.delivered_by
                                        ? new Date(o.delivered_by)
                                              .toISOString()
                                              .split("T")[0]
                                        : "—"}
                                </td>
                                <td className="px-3 py-2 ">
                                    {o.package_content || "—"}
                                </td>
                                <td className="px-3 py-2 ">
                                    {o.package_size || "—"}
                                </td>
                                <td className="px-3 py-2 ">
                                    {o.package_weight || "—"}
                                </td>
                                <td className="px-3 py-2 ">
                                    <StatusBadge status={o.status} />
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-3 py-8 text-center text-foreground"
                                >
                                    No orders match your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
