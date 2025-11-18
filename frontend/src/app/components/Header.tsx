// frontend/src/components/Header.tsx

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // Import the Link component for navigation

interface User {
  username: string;
  avatar_url: string;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  // This hook checks the user's session status on the client side
  useEffect(() => {
    fetch('http://localhost:8080/api/auth/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(userData => {
        setUser(userData);
      });
  }, []);

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #333',
  };

  const navLinksStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  };

  return (
    <header style={headerStyle}>
      <Link href="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold' }}>
        Skincity
      </Link>
      <nav style={navLinksStyle}>
        {user ? (
          // If the user is logged in, show their profile link and a logout button
          <>
            <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', textDecoration: 'none' }}>
              <img src={user.avatar_url} alt={user.username} width={32} height={32} style={{ borderRadius: '50%' }} />
              <span>{user.username}</span>
            </Link>
            <a href="http://localhost:8080/api/auth/logout" style={{ color: 'white', textDecoration: 'none' }}>Logout</a>
          </>
        ) : (
          // If the user is not logged in, show the login button
          <a href="http://localhost:8080/api/auth/steam">
            <button style={{ padding: '0.5rem 1rem' }}>Login with Steam</button>
          </a>
        )}
      </nav>
    </header>
  );
}