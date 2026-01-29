import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";
import { ThemeProvider } from "../lib/theme-context";
import { ThemeProvider as MuiThemeProvider } from "../components/mui-theme-provider";
import UserNav from "../components/user-nav";

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap'
});

export const metadata: Metadata = {
  title: "Turest - Next.js with Supabase",
  description: "A Next.js project with Tailwind CSS and Supabase integration using Poppins font",
};

export default function RootLayout({
  children,
}: Readonly<{  
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <AuthProvider>
          <ThemeProvider>
            <MuiThemeProvider>
              <div className="min-h-screen">
                {children}
              </div>
            </MuiThemeProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}