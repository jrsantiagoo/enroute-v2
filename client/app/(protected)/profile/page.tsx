"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChangePasswordCard from "@/components/profile/change-password-card";
import ProfileCard from "@/components/profile/avatar-card";
import Toast from "@/components/ui/toast";
import * as managerApi from "@/lib/api/manager";

export default function ProfilePage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [toast, setToast] = useState<string | null>(null);

    async function fetchProfile() {
        const accessToken = localStorage.getItem("access_token");

        if (!accessToken) {
            router.push("/");
            return;
        }

        const data = await managerApi.getProfile(accessToken);

        if (data.success) {
            const { firstname, lastname } = data.data;
            setUsername(`${firstname} ${lastname}`);
            setEmail(data.data.email);
        } else {
            router.push("/");
        }
    }

    useEffect(() => {
        fetchProfile();
    }, []);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col justify-center">
                <h1 className="text-3xl font-bold">Account Profile</h1>
                <p className="text-md text-muted-foreground">
                    Manage your account
                </p>
            </div>

            <ProfileCard username={username} email={email} />

            <ChangePasswordCard
                onSuccess={() =>
                    setToast(
                        "Password changed successfully! Kindly log in again with your new password.",
                    )
                }
            />

            {toast && (
                <Toast
                    message={toast}
                    position="bottom-right"
                    onDismiss={() => setToast(null)}
                />
            )}
        </div>
    );
}
