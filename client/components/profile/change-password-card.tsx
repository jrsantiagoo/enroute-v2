"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff } from "lucide-react";
import { changePassword } from "../../lib/api/auth";

interface ChangePasswordCardProps {
    onSuccess?: () => void;
}

export default function ChangePasswordCard({
    onSuccess,
}: ChangePasswordCardProps) {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await changePassword(
                currentPassword,
                newPassword,
                confirmPassword,
            );
            if (result.error) {
                alert(result.error); // or show error in UI
            } else {
                onSuccess?.();
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                alert(
                    "Password changed successfully! Kindly log in again with your new password.",
                );
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                router.push("/"); // Redirect to login page after password change
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="flex flex-col gap-2 justify-between rounded-xl bg-card border border-card-border shadow-xl shadow-primary">
            <div className="flex items-center gap-2 pt-7 pl-7 text-lg font-semibold">
                <Lock size={21} className="text-primary-foreground" />
                <h3 className="mt-1 text-foreground">Change Password</h3>
            </div>
            <p className="pl-7 text-sm text-muted-foreground">
                Update your password
            </p>

            {/* Enables Password Change */}
            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-6 pl-7 pr-7 pb-7 pt-5"
            >
                {/* Current Password Input */}
                <div className="flex flex-col gap-1.5">
                    <label
                        htmlFor="current-password"
                        className="text-sm font-semibold text-foreground"
                    >
                        Current Password
                    </label>
                    <div className="relative">
                        <input
                            id="current-password"
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="bg-background border border-border rounded-lg p-2 text-sm text-foreground w-full 
                            focus:outline-none focus:ring-2 focus:ring-primary-foreground"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setShowCurrentPassword(!showCurrentPassword)
                            }
                            aria-label={
                                showCurrentPassword
                                    ? "Hide password"
                                    : "Show password"
                            }
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                        >
                            {showCurrentPassword ? (
                                <EyeOff
                                    size={18}
                                    className="hover:text-muted-foreground"
                                ></EyeOff>
                            ) : (
                                <Eye
                                    size={18}
                                    className="hover:text-muted-foreground"
                                ></Eye>
                            )}
                        </button>
                    </div>
                </div>

                {/* New Password Input */}
                <div className="flex flex-col gap-1.5">
                    <label
                        htmlFor="new-password"
                        className="text-sm font-semibold text-foreground"
                    >
                        New Password
                    </label>
                    <div className="relative">
                        <input
                            id="new-password"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="bg-background border border-border rounded-lg p-2 text-sm text-foreground w-full 
                            focus:outline-none focus:ring-2 focus:ring-primary-foreground"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            aria-label={
                                showNewPassword
                                    ? "Hide password"
                                    : "Show password"
                            }
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                        >
                            {showNewPassword ? (
                                <EyeOff
                                    size={18}
                                    className="hover:text-muted-foreground"
                                ></EyeOff>
                            ) : (
                                <Eye
                                    size={18}
                                    className="hover:text-muted-foreground"
                                ></Eye>
                            )}
                        </button>
                    </div>
                </div>

                {/* Confirm New Password Input */}
                <div className="flex flex-col gap-1.5">
                    <label
                        htmlFor="confirm-password"
                        className="text-sm font-semibold text-foreground"
                    >
                        Confirm New Password
                    </label>
                    <div className="relative">
                        <input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="bg-background border border-border rounded-lg p-2 text-sm text-foreground w-full 
                            focus:outline-none focus:ring-2 focus:ring-primary-foreground"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                            aria-label={
                                showConfirmPassword
                                    ? "Hide password"
                                    : "Show password"
                            }
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                        >
                            {showConfirmPassword ? (
                                <EyeOff
                                    size={18}
                                    className="hover:text-muted-foreground"
                                ></EyeOff>
                            ) : (
                                <Eye
                                    size={18}
                                    className="hover:text-muted-foreground"
                                ></Eye>
                            )}
                        </button>
                    </div>
                </div>

                {/* Enables Password Change */}
                <div className="flex justify-end -mt-1 mb-1">
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-semibold text-white bg-btn-danger hover:bg-btn-danger-hover rounded-lg transition"
                    >
                        Update Password
                    </button>
                </div>
            </form>
        </div>
    );
}
