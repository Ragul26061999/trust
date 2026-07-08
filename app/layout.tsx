import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";
import { ThemeProvider } from "../lib/theme-context";
import { LanguageProvider } from "../lib/language-context";
import { ThemeProvider as MuiThemeProvider } from "../components/mui-theme-provider";
import UserNav from "../components/user-nav";
import ThemeInitializer from "../components/theme-initializer";
import { TimeEngineProvider } from "../lib/time-engine";
import TaskNotificationPopup from "../components/TaskNotificationPopup";

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
    <html lang="en" data-scroll-behavior="smooth">
      <body className={poppins.className}>
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>
              <MuiThemeProvider>
                <TimeEngineProvider>
                  <div className="min-h-screen">
                    <ThemeInitializer />
                    {children}
                    <TaskNotificationPopup />
                  </div>
                </TimeEngineProvider>
              </MuiThemeProvider>
            </LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}