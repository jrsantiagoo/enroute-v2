"use client";

/**
 * Route Creation page — owns the saved-routes list and decides which modal is
 * open. All persistence goes through lib/routing/storageHelper.
 *
 * Section map:
 *   1. IMPORTS
 *   2. PAGE STATE + LOCALSTORAGE LOADING
 *   3. ROUTE ACTION HANDLERS
 *   4. DARK MODE STYLES
 *   5. PAGE LAYOUT
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. IMPORTS
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { RoutePlan } from "@/lib/types/schema";
import {
    loadSavedRoutes,
    deleteRoute,
    setRouteArchived,
} from "@/lib/routing/storageHelper";
import { useTheme } from "@/lib/theme-context";
import { DARK } from "@/components/routing/routeTheme";
import CreateRouteModal from "@/components/routing/CreateRouteModal";
import SavedRoutesTable from "@/components/routing/SavedRoutesTable";
import ConfirmDialog from "@/components/routing/ConfirmDialog";
import TableSkeleton from "@/components/ui/table-skeleton";
import Toast from "@/components/ui/toast";
import * as routeApi from "@/lib/api/routes";

export default function RouteCreationPage() {
    const { theme } = useTheme();
    const dark = theme === "dark";

    // ─────────────────────────────────────────────────────────────────────────
    // 2. PAGE STATE + LOCALSTORAGE LOADING
    // Every mutation below calls a storage helper then reload(), so the table
    // can never drift out of sync with what is actually stored.
    // ─────────────────────────────────────────────────────────────────────────

    const [savedRoutes, setSavedRoutes] = useState<RoutePlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState<RoutePlan | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<RoutePlan | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            const res = await routeApi.getRoutes();
            if (res.success) {
                setSavedRoutes(res.data);
            } else {
                console.error("Failed to load routes:", res);
                setToast("Could not load routes from server.");
            }
        } catch (err) {
            console.error("Failed to load routes:", err);
            setToast("Could not reach the server.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Read localStorage after mount so the server and first client render match.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        reload();
    }, [reload]);

    // ─────────────────────────────────────────────────────────────────────────
    // 3. ROUTE ACTION HANDLERS
    // Create / edit / archive / restore / delete. Archived routes are
    // read-only — the table hides Edit and Delete for them, and openEdit /
    // confirmDelete below refuse them as a second line of defense.
    // ─────────────────────────────────────────────────────────────────────────

    function openCreate() {
        setEditingRoute(null);
        setIsModalOpen(true);
    }

    function openEdit(route: RoutePlan) {
        if (route.archived) return; // restore it first
        setEditingRoute(route);
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setEditingRoute(null);
    }

    function handleSaved(message: string) {
        const wasEditing = !!editingRoute;
        reload();
        closeModal();
        setToast(message || (wasEditing ? "Route updated." : "Route saved."));
    }

    async function handleArchive(route: RoutePlan) {
        try {
            const res = await routeApi.archiveRoute(route);
            if (res.success) {
                reload();
                setToast("Route archived.");
            } else {
                console.error("Failed to archive route:", res);
                alert("Failed to archive route.");
            }
        } catch (err) {
            console.error("Failed to archive route:", err);
            alert("Could not reach the server.");
        }
    }

    async function handleUnarchive(route: RoutePlan) {
        try {
            const res = await routeApi.unarchiveRoute(route);
            if (res.success) {
                reload();
                setToast("Route unarchived.");
            } else {
                console.error("Failed to unarchive route:", res);
                alert("Failed to unarchive route.");
            }
        } catch (err) {
            console.error("Failed to unarchive route:", err);
            alert("Could not reach the server.");
        }
    }

    async function confirmDelete() {
        if (!deleteTarget || deleteTarget.archived) return;
        try {
            const res = await routeApi.deleteRoute(deleteTarget);
            if (res.success) {
                reload();
                setToast("Route deleted.");
            } else {
                console.log("Failed to delete route:", res);
                alert(res.message || "Failed to delete route.");
            }
        } catch (err) {
            console.error("Failed to delete route:", err);
            alert("Could not reach the server.");
        }
        setDeleteTarget(null);
    }

    // Names of other routes — lets an edited route keep its own name.
    const existingNames = savedRoutes
        .filter((r) => r.id_ !== editingRoute?.id_)
        .map((r) => r.name);

    // ─────────────────────────────────────────────────────────────────────────
    // 4. DARK MODE STYLES — palette lives in components/routing/routeTheme.ts
    // ─────────────────────────────────────────────────────────────────────────

    const text = dark ? DARK.text : "#111827";
    const muted = dark ? DARK.textMuted : "#6b7280";
    const border = dark ? DARK.panelBorder : "#d1d5db";

    // ─────────────────────────────────────────────────────────────────────────
    // 5. PAGE LAYOUT
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div style={{ width: "100%" }}>
            {/* Page header */}
            <div style={{ marginBottom: "20px" }}>
                <h1
                    style={{
                        margin: 0,
                        fontSize: "26px",
                        fontWeight: 700,
                        color: text,
                    }}
                >
                    Route Creation
                </h1>
                <p
                    style={{
                        margin: "6px 0 0",
                        fontSize: "14px",
                        color: muted,
                    }}
                >
                    Create and manage delivery routes across your fleet.
                </p>
            </div>

            {/* Actions row */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                    gap: "12px",
                }}
            >
                <button
                    onClick={openCreate}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 18px",
                        background: dark ? DARK.btnBg : "#fff",
                        color: DARK.btnText,
                        border: `1px solid ${dark ? DARK.btnBorder : "#d9dfe5"}`,
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 600,
                        transition: "background 0.15s",
                        cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (
                        (e.currentTarget.style.background = "#c1dff8"),
                        (e.currentTarget.style.color = `${dark ? "var(--primary)" : "var(--foreground)"}`)
                    )}
                    onMouseLeave={(e) => (
                        (e.currentTarget.style.background = dark
                            ? DARK.btnBg
                            : "#fff"),
                        (e.currentTarget.style.color = "var(--foreground)")
                    )}
                >
                    <Plus size={16} strokeWidth={2} />
                    Create New Route
                </button>

                <button
                    onClick={reload}
                    title="Refresh"
                    aria-label="Refresh saved routes"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        border: `1px solid ${border}`,
                        background: dark ? DARK.btnBg : "#fff",
                        color: muted,
                        cursor: "pointer",
                    }}
                >
                    <RefreshCw size={17} strokeWidth={2} />
                </button>
            </div>

            {loading ? (
                <TableSkeleton rows={8} />
            ) : (
                <SavedRoutesTable
                    routes={savedRoutes}
                    onEdit={openEdit}
                    onArchive={handleArchive}
                    onUnarchive={handleUnarchive}
                    onDelete={(route) => setDeleteTarget(route)}
                />
            )}

            {isModalOpen && (
                <CreateRouteModal
                    editingRoute={editingRoute}
                    existingNames={existingNames}
                    onClose={closeModal}
                    onSaved={handleSaved}
                />
            )}

            {deleteTarget && (
                <ConfirmDialog
                    title="Delete route?"
                    message={`“${deleteTarget.name}” will be permanently removed. This cannot be undone.`}
                    confirmLabel="Delete"
                    danger
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            {toast && (
                <Toast message={toast} onDismiss={() => setToast(null)} />
            )}
        </div>
    );
}
