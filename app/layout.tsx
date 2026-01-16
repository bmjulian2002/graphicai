import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "GraphicAI - Flow Management",
    description: "Gestiona tus diagramas de React Flow con autenticación y base de datos",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className={inter.className}>
                <Providers>{children}</Providers>
                <Analytics />
            </body>
        </html>
    );
}
