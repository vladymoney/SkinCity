// frontend/src/app/layout.tsx

"use client"; // This component needs to be a client component to manage state

import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";         // Use '@' alias for clean imports
import InventoryModal from "./components/InventoryModal"; // Use '@' alias for clean imports
import { useState, useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

// Define the User type that matches our session data
interface User {
  username: string;
  avatar_url: string;
  balance: number;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // State to control the visibility of the inventory modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State to hold the currently logged-in user's data
  const [user, setUser] = useState<User | null>(null);

  // Fetch the user's session status when the layout first loads
  useEffect(() => {
    fetch('http://localhost:8080/api/auth/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(userData => setUser(userData));
  }, []);

  return (
    <html lang="en">
      <head>
        <title>Skincity</title>
        {/* Metadata is now placed directly in the <head> tag */}
        <meta name="description" content="CS2 Skin Trading Marketplace" />
      </head>
      <body className={inter.className} style={{ backgroundColor: '#0d0d0d', color: 'white' }}>
        
        {/* 
          Render the Header, passing down the user data and the function 
          to open the modal, now correctly named 'onTradeClick'.
        */}
        <Header user={user} onTradeClick={() => setIsModalOpen(true)} />
        
        {/* 
          Conditionally render the InventoryModal only when isModalOpen is true.
          Pass the function to close the modal.
        */}
        {isModalOpen && <InventoryModal onClose={() => setIsModalOpen(false)} />}
        
        {/* All other pages will be rendered inside this main tag */}
        <main style={{ padding: '2rem' }}>
          {children}
        </main>
      </body>
    </html>
  );
}