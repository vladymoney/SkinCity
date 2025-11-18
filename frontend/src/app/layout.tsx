// frontend/src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 1. Import the Header component we just created
import Header from "./components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Skincity",
  description: "CS2 Skin Trading Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ backgroundColor: '#0d0d0d', color: 'white' }}>
        {/* 2. Add the Header component here, above the page content */}
        <Header />
        
        {/* The rest of the page (e.g., homepage, profile page) will be rendered here */}
        <main style={{ padding: '2rem' }}>
          {children}
        </main>
      </body>
    </html>
  );
}