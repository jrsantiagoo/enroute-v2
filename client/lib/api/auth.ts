const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function login(email: string, password: string) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });
    return response.json();
}

export async function refreshToken(refreshToken: string) {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
    });
    return response.json();
}

export async function logout() {
    // Clear tokens from local storage
    const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    return response.json();
}

export async function changePassword(
    oldPassword: string,
    newPassword: string,
    confirmPassword: string,
) {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
    });
    return response.json();
}

interface AuthApiResponse {
    success: boolean;
    error?: string;
    message?: string;
}

export async function forgotPassword(email: string): Promise<AuthApiResponse> {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });
    return response.json();

    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true };
}

export async function resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string,
): Promise<AuthApiResponse> {
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
    });
    return response.json();

    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true };
}
