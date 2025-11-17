"use client";

import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  avatar_url: string;
  balance: number;
}

interface InventoryItem {
  assetid: string;
  name: string;
  image: string;
  rarity_color: string;
}

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[] | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Could not connect to the backend.", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUserSession();
  }, []);

  const fetchInventory = async () => {
    setInventoryLoading(true);
    setInventory(null);
    setInventoryError(null);
    
    try {
      const res = await fetch('http://localhost:8080/api/inventory/cs2', { credentials: 'include' });
      if (res.ok) {
        const inventoryData = await res.json();
        setInventory(inventoryData);
      } else {
        const errorData = await res.json();
        setInventoryError(errorData.message || "An unknown error occurred.");
      }
    } catch (error) {
      console.error("A network error occurred:", error);
      setInventoryError("Could not connect to the server to fetch inventory.");
    } finally {
      setInventoryLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const InventoryDisplay = ({ items }: { items: InventoryItem[] }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '20px' }}>
      {items.map((item, index) => (
        <div key={item.assetid || `fallback-key-${index}`} style={{ border: '1px solid #333', padding: '10px', textAlign: 'center', backgroundColor: '#222' }}>
          <img src={`https://community.cloudflare.steamstatic.com/economy/image/${item.image}`} alt={item.name} style={{ maxWidth: '100px', maxHeight: '100px' }} />
          <p style={{ color: item.rarity_color, fontSize: '14px', marginTop: '5px', minHeight: '40px' }}>
            {item.name}
          </p>
        </div>
      ))}
    </div>
  );

  const UserProfile = ({ user }: { user: User }) => (
    <div>
      <h2>Welcome, {user.username}!</h2>
      <img src={user.avatar_url} alt={`${user.username}'s avatar`} width="100" />
      <p>Your balance: {user.balance}</p>
      <a href="http://localhost:8080/api/auth/logout">Logout</a>
      <hr style={{ margin: '20px 0' }} />
      
      <button onClick={fetchInventory} disabled={inventoryLoading} style={{ padding: '10px 20px', fontSize: '16px' }}>
        {inventoryLoading ? 'Loading Inventory...' : 'View CS2 Inventory'}
      </button>

      <div style={{ marginTop: '20px' }}>
        {inventoryLoading && <p>Loading items...</p>}
        {inventoryError && <p style={{ color: 'red' }}>Error: {inventoryError}</p>}
        {inventory && inventory.length > 0 && <InventoryDisplay items={inventory} />}
        {inventory && inventory.length === 0 && <p>No CS2 items found in this inventory.</p>}
      </div>
    </div>
  );

  const LoginButton = () => (
    <div>
      <h1>Welcome to Skincity</h1>
      <p>Please log in to continue.</p>
      <a href="http://localhost:8080/api/auth/steam">
        <button style={{ padding: '10px 20px', fontSize: '16px' }}>
          Login with Steam
        </button>
      </a>
    </div>
  );

  return (
    <main>
      {user ? <UserProfile user={user} /> : <LoginButton />}
    </main>
  );
}