// frontend/src/app/profile/page.tsx - FINAL COMPLETE VERSION

"use client";

import React, { useState, useEffect } from 'react';

// Define User type including steam_id and trade_link
interface User {
  id: string;
  steam_id: string;
  username: string;
  avatar_url: string;
  balance: number;
  trade_link: string | null;
}

interface InventoryItem {
  assetid: string;
  name: string;
  image: string;
  rarity_color: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State for the trade link input and save status
  const [tradeLink, setTradeLink] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  // State for the inventory
  const [inventory, setInventory] = useState<InventoryItem[] | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const userData: User = await response.json();
          setUser(userData);
          setTradeLink(userData.trade_link || ''); // Populate input with existing trade link
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

  const handleSaveTradeLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('Saving...');
    try {
      const response = await fetch('http://localhost:8080/api/user/trade-url', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ trade_link: tradeLink }),
      });
      if (response.ok) {
        setSaveStatus('Saved successfully!');
      } else {
        const errorData = await response.json();
        setSaveStatus(`Error: ${errorData.message}`);
      }
    } catch (error) {
      setSaveStatus('Error: Could not connect to the server.');
    }
  };

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

  // Dynamic URL for the button that opens the Steam page
  const steamTradeOfferUrl = `https://steamcommunity.com/profiles/${user?.steam_id}/tradeoffers/privacy`;

  if (loading) return <div>Loading profile...</div>;
  if (!user) return <div><h1>Access Denied</h1><p>You must be logged in to view this page.</p></div>;

  const InventoryDisplay = ({ items }: { items: InventoryItem[] }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '20px' }}>
      {items.map(item => (
        <div key={item.assetid} style={{ border: '1px solid #333', padding: '10px', textAlign: 'center', backgroundColor: '#222' }}>
          <img src={`https://community.cloudflare.steamstatic.com/economy/image/${item.image}`} alt={item.name} style={{ maxWidth: '100px', maxHeight: '100px' }} />
          <p style={{ color: item.rarity_color, fontSize: '14px', marginTop: '5px', minHeight: '40px' }}>{item.name}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <h1>{user.username}'s Profile</h1>
      <img src={user.avatar_url} alt={`${user.username}'s avatar`} width="150" />
      <p>Your balance: {user.balance}</p>
      
      {/* --- THIS IS THE MISSING TRADE URL SECTION --- */}
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #333', borderRadius: '8px' }}>
        <h3>Your Steam Trade URL</h3>
        <p>Our bots need your Trade URL to send you items. This must be set correctly.</p>
        
        <a href={steamTradeOfferUrl} target="_blank" rel="noopener noreferrer">
          <button type="button" style={{ marginBottom: '15px' }}>
            Get Your Trade URL from Steam
          </button>
        </a>

        <form onSubmit={handleSaveTradeLink} style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={tradeLink}
            onChange={(e) => setTradeLink(e.target.value)}
            placeholder="Paste your Trade URL here"
            style={{ flexGrow: 1, padding: '8px', marginRight: '10px', color: 'black' }}
          />
          <button type="submit">Save</button>
        </form>
        {saveStatus && <p style={{ marginTop: '10px' }}>{saveStatus}</p>}
      </div>
      
      <hr style={{ margin: '40px 0' }} />

      <h2>Your Inventory</h2>
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
}