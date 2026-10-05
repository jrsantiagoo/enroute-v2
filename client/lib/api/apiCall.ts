import { useRouter } from "next/navigation";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiCall(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem("access_token");
    const headers: any = {
        "Content-Type": "application/json",
        ...options.headers,
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // Handle token refresh if token expires
    if (response.status === 401) {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
            try {
                const refreshResponse = await fetch(
                    `${API_URL}/api/auth/refresh`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ refresh_token: refreshToken }),
                    },
                );

                if (refreshResponse.ok) {
                    const { access_token } = await refreshResponse.json();
                    localStorage.setItem("access_token", access_token);

                    // Retry original request with new token
                    headers.Authorization = `Bearer ${access_token}`;
                    response = await fetch(`${API_URL}${endpoint}`, {
                        ...options,
                        headers,
                    });
                }
            } catch (err) {
                console.error("Token refresh failed:", err);
                redirectToLogin();
            }
        } else {
            redirectToLogin();
        }
    }
    return response;
}

function redirectToLogin() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/";
}
