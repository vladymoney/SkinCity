"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Settings, RefreshCw, History, Wallet, LayoutDashboard, Package, Tag } from 'lucide-react';
import SkinCard from '../components/SkinCard';
import InventoryFilters from '../components/InventoryFilters';
import InspectModal from '../components/InspectModal'; 
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
  inspect_link?: string;
  float?: any;
  pricelatest?: number;
  pricereal?: number;
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
    types: [],
    rarities: [],
    sortBy: 'newest',
    priceRange: [0, 1000],
  });

  const [inspectingItem, setInspectingItem] = useState<InventoryItem | null>(null);

  // --- DATA LOADING ---
  useEffect(() => { loadProfileData(); }, []);

  const loadProfileData = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    try {
      const userRes = await fetch('http://localhost:8080/api/auth/me', { credentials: 'include' });
      if (!userRes.ok) throw new Error("Not logged in");
      setUser(await userRes.json());
      
      if (inventory.length === 0 || forceRefresh) {
        const invRes = await fetch('http://localhost:8080/api/inventory/cs2', { credentials: 'include' });
        if (invRes.ok) {
          const data = await invRes.json();
          console.log("Inventory loaded:", data.length, "items");
          console.log("Sample item:", data[0]); // Debug
          
          // Debug: Log unique rarities
          const rarities = new Set(data.map((item: any) => item.rarity?.toLowerCase()).filter(Boolean));
          console.log("Available rarities:", Array.from(rarities));
          
          setInventory(data);
        }
      }
      
      if (listedItems.length === 0 || forceRefresh) {
        const listedRes = await fetch('http://localhost:8080/api/showcase/mine', { credentials: 'include' });
        if (listedRes.ok) setListedItems(await listedRes.json());
      }
    } catch (error) {
      console.error("Profile load error:", error);
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
                body: JSON.stringify({ 
                  assetid: skin.assetid, 
                  name: skin.name, 
                  image_url: skin.image, 
                  rarity_color: skin.rarity_color 
                }),
            });
        }
        const listedRes = await fetch('http://localhost:8080/api/showcase/mine', { credentials: 'include' });
        if (listedRes.ok) setListedItems(await listedRes.json());
    } catch (error) {
      console.error("List action error:", error);
      alert("Action failed.");
    }
  };
  
  // --- FILTERING ---
  // Get unique types and rarities from inventory
  const availableTypes = useMemo(() => {
    if (!inventory || inventory.length === 0) return [];
    const types = new Set(
      inventory
        .map(item => item.rarity?.toLowerCase().trim())
        .filter(Boolean)
    );
    return Array.from(types).sort();
  }, [inventory.length]);

  const availableRarities = useMemo(() => {
    if (!inventory || inventory.length === 0) return [];
    const rarities = new Set(
      inventory
        .map(item => item.rarity_color?.replace('#', '').toLowerCase())
        .filter(Boolean)
    );
    return Array.from(rarities).sort();
  }, [inventory.length]);

  // Calculate max price for slider
  const maxPrice = useMemo(() => {
    if (!inventory || inventory.length === 0) return 1000;
    const prices = inventory.map(item => item.pricereal || item.pricelatest || 0);
    return Math.ceil(Math.max(...prices, 100));
  }, [inventory.length]);

  const filteredInventory = useMemo(() => {
    let items = [...inventory];
    
    // Search filter
    if (filters.search) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    
    // Type filter (weapon type like AK-47, AWP, etc.)
    if (filters.types && filters.types.length > 0) {
      items = items.filter(item => {
        if (!item.rarity) return false;
        const itemType = item.rarity.toLowerCase().trim();
        return filters.types.includes(itemType);
      });
    }
    
    // Rarity filter (color grade)
    if (filters.rarities && filters.rarities.length > 0) {
      items = items.filter(item => {
        if (!item.rarity_color) return false;
        const itemRarity = item.rarity_color.replace('#', '').toLowerCase();
        return filters.rarities.includes(itemRarity);
      });
    }
    
    // Price range filter
    if (filters.priceRange) {
      items = items.filter(item => {
        const price = item.pricereal || item.pricelatest || 0;
        return price >= filters.priceRange[0] && price <= filters.priceRange[1];
      });
    }
    
    // Sorting
    if (filters.sortBy === 'name_asc') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sortBy === 'name_desc') {
      items.sort((a, b) => b.name.localeCompare(a.name));
    } else if (filters.sortBy === 'price_high') {
      items.sort((a, b) => (b.pricereal || b.pricelatest || 0) - (a.pricereal || a.pricelatest || 0));
    } else if (filters.sortBy === 'price_low') {
      items.sort((a, b) => (a.pricereal || a.pricelatest || 0) - (b.pricereal || b.pricelatest || 0));
    }
    
    return items;
  }, [inventory, filters]);

  // --- RENDER ---
  if (isLoading && !user) return <div className="text-center p-10 text-white">Loading Profile...</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center text-gray-400">Please login to view your profile.</div>;

  const listedAssetIds = new Set(listedItems.map(item => item.assetid));

  return (
    <div className="min-h-screen bg-cs-dark py-8 pb-20">
      
      {/* INSPECT MODAL */}
      {inspectingItem && (
        <InspectModal 
          item={inspectingItem}
          onClose={() => setInspectingItem(null)}
        />
      )}

      <div className="container mx-auto px-4">
        
        {/* HEADER */}
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
           {/* SIDEBAR */}
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

           {/* CONTENT */}
           <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 p-6">
              {activeTab === 'inventory' && (
                 <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white">My Inventory ({filteredInventory.length})</h2>
                      <button 
                        onClick={() => loadProfileData(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                      </button>
                    </div>

                    <InventoryFilters 
                      filters={filters} 
                      onChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))} 
                      availableTypes={availableTypes}
                      availableRarities={availableRarities}
                      maxPrice={maxPrice}
                    />
                    
                    {isLoading ? (
                      <div className="text-center py-12 text-gray-500">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                        Loading inventory...
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                         {filteredInventory.map((item) => {
                            const isListed = listedAssetIds.has(item.assetid);
                            return (
                              <div key={item.assetid} className="group">
                                {/* Card - Click to inspect */}
                                <div 
                                  onClick={() => setInspectingItem(item)} 
                                  className="w-full text-left mb-2 transition-transform hover:-translate-y-1 cursor-pointer"
                                >
                                  {/* FIXED: Directly render image instead of using SkinCard */}
                                  <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-blue-500 transition h-full flex flex-col">
                                    {/* Image */}
                                    <div className="aspect-square bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
                                      <img 
                                        src={item.image} 
                                        alt={item.name}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                          // Fallback to placeholder if image fails
                                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23334155' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23475569' dy='.3em' font-family='Arial' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
                                        }}
                                      />
                                    </div>
                                    
                                    {/* Info - Fixed height */}
                                    <div className="p-3 flex-1 flex flex-col">
                                      <div 
                                        className="text-sm font-semibold mb-1 truncate"
                                        style={{ color: item.rarity_color || '#fff' }}
                                      >
                                        {item.name}
                                      </div>
                                      
                                      {/* Float badge if available - fixed height container */}
                                      <div className="h-5 mb-1">
                                        {item.float?.floatvalue && (
                                          <div className="text-xs text-yellow-400 font-mono">
                                            Float: {item.float.floatvalue.toFixed(4)}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Price */}
                                      <div className="text-green-400 font-bold text-sm mt-auto">
                                        {item.pricereal ? `$${item.pricereal}` : 
                                         item.pricelatest ? `$${item.pricelatest}` : 
                                         'N/A'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* List/Unlist Button */}
                                {isListed ? (
                                  <button onClick={() => handleListAction(item, true)} className="w-full text-xs font-bold py-2 bg-red-600/80 hover:bg-red-600 text-white rounded transition">Unlist</button>
                                ) : (
                                  <button onClick={() => handleListAction(item, false)} className="w-full text-xs font-bold py-2 bg-green-600/80 hover:bg-green-600 text-white rounded transition">List for Trade</button>
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
                    )}
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
}