import { User } from "lucide-react";

interface ProfileCardProps {
    username: string;
    email: string;
}

export default function ProfileCard({ username, email }: ProfileCardProps) {
    const initials = `${username.charAt(0)}`.toUpperCase();

    return (
        <div className="flex flex-col gap-2 justify-between rounded-xl bg-card border border-card-border shadow-lg shadow-primary">
            <div className="flex items-center gap-6 pl-7 pb-7 pt-5">
                {/* Displays user's profile avatar */}
                <div className="shrink-0 w-25 h-25 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                    <span className="text-2xl font-bold text-primary-foreground">
                        {initials}
                    </span>
                </div>

                {/* Displays User Information */}
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-bold text-foreground">
                        {username}
                    </h2>
                    <p className="text-sm text-muted-foreground">{email}</p>
                </div>
            </div>
        </div>
    );
}
