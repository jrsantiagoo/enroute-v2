import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-context";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Route Management App",
    description: "",
};

// Prevents Flash of Wrong Theme
// Reads the saved theme from localStorage and applies it
// before browser is painted
const themeScript = `
    (function() {
        try {
            var theme = localStorage.getItem("theme");
            if (
                theme === "dark" ||
                (!theme &&
                    window.matchMedia &&
                    window.matchMedia("(prefers-color-scheme: dark)")
                        .matches)
            ) {
                document.documentElement.classList.add("dark");
            }
        } catch (e) {}
    })();
`;

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
                <ThemeProvider>{children}</ThemeProvider>
            </body>
        </html>
    );
}
