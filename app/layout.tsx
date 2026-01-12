import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";
import UserNav from "../components/user-nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Turest - Next.js with Supabase",
  description: "A Next.js project with Tailwind CSS and Supabase integration",
};

export default function RootLayout({
  children,
}: Readonly<{  
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}