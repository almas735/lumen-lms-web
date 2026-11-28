import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import Header from "../components/Header";

export const metadata: Metadata = {
  title: "Lumen LMS",
  description: "Learning Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-blue-700">Skip to main content</a>
          <Header />
          <div id="main" tabIndex={-1} className="focus:outline-none">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}