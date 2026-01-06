// frontend/src/app/profile/page.tsx - FINAL COMPLETE VERSION

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Settings, RefreshCw, History, Wallet, LayoutDashboard, Package, Tag } from 'lucide-react';
import SkinCard from '../components/SkinCard';
import InventoryFilters from '../components/InventoryFilters';
import InspectModal from '../components/InspectModal'; // Import the new InspectModal
import { InventoryFilters as IFilters } from '@/types';

// --- TYPES ---
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
  rarity: string;
  // ADD THESE TWO LINES:
  inspect_link?: string; 
  actions?: { link: string; name: string }[]; 
}

interface ListedItem {
  id: string;
  assetid: string;
}

type ProfileTab = 'overview' | 'inventory' | 'listings' | 'history' | 'wallet' | 'settings';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [listedItems, setListedItems] = useState<ListedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<IFilters>({
    search: '',
    rarities: [],
    sortBy: 'newest',
  });

  // State to manage the inspect modal
  const [inspectingItem, setInspectingItem] = useState<InventoryItem | null>(null);

  // --- DATA LOADING & ACTIONS ---
  useEffect(() => { loadProfileData(); }, []);

  const loadProfileData = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    try {
      const userRes = await fetch('http://localhost:8080/api/auth/me', { credentials: 'include' });
      if (!userRes.ok) throw new Error("Not logged in");
      setUser(await userRes.json());
      if (inventory.length === 0 || forceRefresh) {
        const invRes = await fetch('http://localhost:8080/api/inventory/cs2', { credentials: 'include' });
        if (invRes.ok) setInventory(await invRes.json());
      }
      if (listedItems.length === 0 || forceRefresh) {
        const listedRes = await fetch('http://localhost:8080/api/showcase/mine', { credentials: 'include' });
        if (listedRes.ok) setListedItems(await listedRes.json());
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleListAction = async (skin: InventoryItem, isListed: boolean) => {
    try {
        if (isListed) {
            await fetch(`http://localhost:8080/api/showcase/${skin.assetid}`, { method: 'DELETE', credentials: 'include' });
        } else {
            await fetch('http://localhost:8080/api/showcase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ assetid: skin.assetid, name: skin.name, image_url: skin.image, rarity_color: skin.rarity_color }),
            });
        }
        const listedRes = await fetch('http://localhost:8080/api/showcase/mine', { credentials: 'include' });
        if (listedRes.ok) setListedItems(await listedRes.json());
    } catch (error) {
      alert("Action failed.");
    }
  };
  
  // --- FILTERING LOGIC ---
  const filteredInventory = useMemo(() => {
    let items = [...inventory];
    if (filters.search) items = items.filter(item => item.name.toLowerCase().includes(filters.search.toLowerCase()));
    if (filters.rarities.length > 0) items = items.filter(item => item.rarity && filters.rarities.includes(item.rarity));
    if (filters.sortBy === 'name_asc') items.sort((a, b) => a.name.localeCompare(b.name));
    else if (filters.sortBy === 'name_desc') items.sort((a, b) => b.name.localeCompare(a.name));
    return items;
  }, [inventory, filters]);

  // --- RENDER LOGIC ---
  if (isLoading && !user) return <div className="text-center p-10">Loading Profile...</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center text-gray-400">Please login to view your profile.</div>;

  const listedAssetIds = new Set(listedItems.map(item => item.assetid));

  return (
    <div className="min-h-screen bg-cs-dark py-8 pb-20">
      
      {/* Conditionally render the InspectModal */}
      {inspectingItem && (
        <InspectModal 
          item={inspectingItem}
          onClose={() => setInspectingItem(null)}
        />
      )}

      <div className="container mx-auto px-4">
        
        {/* Profile Header */}
        <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <img src={user.avatar_url} alt="Profile" className="w-24 h-24 rounded-full border-4 border-slate-800" />
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{user.username}</h1>
              <a href={`https://steamcommunity.com/profiles/${user.steam_id}`} target="_blank" rel="noreferrer" className="text-sm text-gray-400 hover:underline">
                Steam ID: {user.steam_id}
              </a>
            </div>
          </div>
          <div className="bg-slate-800 px-6 py-3 rounded-xl border border-slate-700 text-right">
              <p className="text-xs text-gray-500 uppercase font-bold">Wallet Balance</p>
              <p className="text-2xl font-bold text-yellow-400">${(user.balance / 100).toFixed(2)}</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
           {/* Sidebar Navigation */}
           <div className="w-full lg:w-64 shrink-0">
              <nav className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                {[
                  { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
                  { id: 'inventory', icon: Package, label: 'My Inventory' },
                  { id: 'listings', icon: Tag, label: 'My Listings' },
                  { id: 'history', icon: History, label: 'Trade History' },
                  { id: 'wallet', icon: Wallet, label: 'Wallet' },
                  { id: 'settings', icon: Settings, label: 'Settings' },
                ].map((item) => (
                  <button key={item.id} onClick={() => setActiveTab(item.id as ProfileTab)} className={`w-full flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-blue-600/10 text-blue-500 border-r-4 border-blue-500' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </nav>
           </div>

           {/* Content Area */}
           <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 p-6">
              {activeTab === 'inventory' && (
                 <div>
                    <InventoryFilters filters={filters} onChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))} />
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                       {filteredInventory.map((item) => {
                          const isListed = listedAssetIds.has(item.assetid);
                          return (
                            <div key={item.assetid}>
                              <button onClick={() => setInspectingItem(item)} className="w-full text-left mb-2 transition-transform hover:-translate-y-1">
                                <SkinCard skin={item} onAction={() => {}} actionLabel="" />
                              </button>
                              {isListed ? (
                                <button onClick={() => handleListAction(item, true)} className="w-full text-xs font-bold py-1 bg-red-600 rounded">Unlist</button>
                              ) : (
                                <button onClick={() => handleListAction(item, false)} className="w-full text-xs font-bold py-1 bg-green-600 rounded">List for Trade</button>
                              )}
                            </div>
                          )
                       })}
                       {filteredInventory.length === 0 && !isLoading && (
                          <div className="col-span-full text-center py-12 text-gray-500">
                            {inventory.length > 0 ? "No items match your filters." : "Your inventory is empty."}
                          </div>
                       )}
                    </div>
                 </div>
              )}
              {activeTab !== 'inventory' && (
                  <div className="h-96 flex items-center justify-center text-gray-500 border-2 border-dashed border-slate-700 rounded-lg">
                      <p>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} section is under construction.</p>
                  </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};