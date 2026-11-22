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
    // 4. PAGE LAYOUT
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Page header */}
            <div className="flex items-center">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold text-foreground">
                        Route Creation
                    </h1>
                    <p className="text-base text-muted-foreground">
                        Create and manage delivery routes across your fleet.
                    </p>
                </div>
            </div>

            {/* Actions row */}
            <div className="flex justify-between items-center">
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-lg border border-btn-border bg-btn
                        text-foreground hover:bg-secondary  transition duration-300 cursor-pointer"
                >
                    <Plus size={16} />
                    Create New Route
                </button>

                <button
                    onClick={reload}
                    title="Refresh"
                    aria-label="Refresh saved routes"
                    className="flex items-center justify-center w-8 h-8 rounded-full border border-btn-border bg-btn 
                        text-muted-foreground hover:bg-secondary  transition duration-300 cursor-pointer"
                >
                    <RefreshCw size={16} />
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
