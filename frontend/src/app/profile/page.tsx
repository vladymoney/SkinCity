"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Settings, RefreshCw, History, Wallet, LayoutDashboard, Package, Tag, X, DollarSign, ExternalLink } from 'lucide-react';
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
  float?: { floatvalue?: number };
  pricelatest?: number;
  pricereal?: number;
}

interface MarketListing {
  id: string;
  assetid: string;
  name: string;
  image_url: string;
  rarity_color: string;
  float_value: string | null;
  price: string;
  status: string;
  listed_at: string;
  purchased_at: string | null;
  completed_at: string | null;
}

type ProfileTab = 'overview' | 'inventory' | 'listings' | 'history' | 'wallet' | 'settings';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  listed:                { label: 'Listed',         color: 'text-green-400' },
  pending_purchase:      { label: 'Pending',        color: 'text-yellow-400' },
  awaiting_seller_trade: { label: 'Awaiting Trade', color: 'text-orange-400' },
  in_escrow:             { label: 'In Escrow',      color: 'text-blue-400' },
  sold:                  { label: 'Sold',           color: 'text-purple-400' },
  cancelled:             { label: 'Cancelled',      color: 'text-gray-500' },
};

const ACTIVE_STATUSES = new Set(['listed', 'pending_purchase', 'awaiting_seller_trade', 'in_escrow']);

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [myListings, setMyListings] = useState<MarketListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<IFilters>({
    search: '',
    types: [],
    rarities: [],
    sortBy: 'newest',
    priceRange: [0, 5],
    floatRange: [0, 1],
  });

  const [inspectingItem, setInspectingItem] = useState<InventoryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  // Sell modal state
  const [sellTarget, setSellTarget] = useState<InventoryItem | null>(null);
  const [sellPrice, setSellPrice] = useState('');
  const [isSelling, setIsSelling] = useState(false);

  // --- DATA LOADING ---
  useEffect(() => { loadProfileData(); }, []);

  const loadProfileData = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const userRes = await fetch('http://localhost:8080/api/auth/me', { credentials: 'include' });
      if (!userRes.ok) throw new Error('Not logged in');
      setUser(await userRes.json());

      if (inventory.length === 0 || forceRefresh) {
        const invRes = await fetch('http://localhost:8080/api/inventory/cs2', { credentials: 'include' });
        if (invRes.ok) setInventory(await invRes.json());
      }

      const listingsRes = await fetch('http://localhost:8080/api/market/my/listings', { credentials: 'include' });
      if (listingsRes.ok) setMyListings(await listingsRes.json());
    } catch (error) {
      console.error('Profile load error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshListings = async () => {
    const res = await fetch('http://localhost:8080/api/market/my/listings', { credentials: 'include' });
    if (res.ok) setMyListings(await res.json());
  };

  const openSellModal = (item: InventoryItem) => {
    const suggested = item.pricereal || item.pricelatest;
    setSellPrice(suggested ? suggested.toFixed(2) : '');
    setSellTarget(item);
  };

  const handleSellSubmit = async () => {
    if (!sellTarget || !sellPrice) return;
    const price = parseFloat(sellPrice);
    if (isNaN(price) || price < 0.50 || price > 10000) {
      alert('Price must be between $0.50 and $10,000');
      return;
    }
    setIsSelling(true);
    try {
      const res = await fetch('http://localhost:8080/api/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          assetid: sellTarget.assetid,
          name: sellTarget.name,
          image_url: sellTarget.image,
          rarity_color: sellTarget.rarity_color,
          float_value: sellTarget.float?.floatvalue ?? null,
          price,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSellTarget(null);
        setSellPrice('');
        await refreshListings();
      } else {
        alert(data.message || 'Failed to create listing');
      }
    } catch {
      alert('Network error');
    } finally {
      setIsSelling(false);
    }
  };

  const handleCancelListing = async (listing: MarketListing) => {
    if (!confirm(`Cancel listing for ${listing.name}?`)) return;
    try {
      const res = await fetch(`http://localhost:8080/api/market/${listing.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        await refreshListings();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to cancel listing');
      }
    } catch {
      alert('Network error');
    }
  };

  const activeListingAssetIds = useMemo(
    () => new Set(myListings.filter(l => ACTIVE_STATUSES.has(l.status)).map(l => l.assetid)),
    [myListings]
  );

  // --- FILTERING ---
  const availableTypes = useMemo(() => {
    if (!inventory.length) return [];
    return Array.from(new Set(inventory.map(i => i.rarity?.toLowerCase().trim()).filter(Boolean))).sort();
  }, [inventory.length]);

  const availableRarities = useMemo(() => {
    if (!inventory.length) return [];
    return Array.from(new Set(inventory.map(i => i.rarity_color?.replace('#', '').toLowerCase()).filter(Boolean))).sort();
  }, [inventory.length]);

  const maxPrice = useMemo(() => {
    if (!inventory.length) return 100;
    const max = Math.max(...inventory.map(i => i.pricereal || i.pricelatest || 0));
    return Math.max(Math.ceil(max), 5);
  }, [inventory.length]);

  useEffect(() => {
    if (inventory.length > 0 && maxPrice > 5 && filters.priceRange[1] <= 5) {
      setFilters(prev => ({ ...prev, priceRange: [0, maxPrice] }));
    }
  }, [inventory.length, maxPrice]);

  const filteredInventory = useMemo(() => {
    let items = [...inventory];
    if (filters.search) items = items.filter(i => i.name.toLowerCase().includes(filters.search.toLowerCase()));
    if (filters.types?.length) items = items.filter(i => filters.types.includes(i.rarity?.toLowerCase().trim()));
    if (filters.rarities?.length) items = items.filter(i => filters.rarities.includes(i.rarity_color?.replace('#', '').toLowerCase()));
    if (filters.priceRange) {
      items = items.filter(i => {
        const p = i.pricereal || i.pricelatest || 0;
        return p >= filters.priceRange[0] && p <= filters.priceRange[1];
      });
    }
    if (filters.floatRange[0] > 0 || filters.floatRange[1] < 1) {
      items = items.filter(i => {
        if (!i.float?.floatvalue) return false;
        return i.float.floatvalue >= filters.floatRange[0] && i.float.floatvalue <= filters.floatRange[1];
      });
    }
    if (filters.sortBy === 'name_asc') items.sort((a, b) => a.name.localeCompare(b.name));
    else if (filters.sortBy === 'name_desc') items.sort((a, b) => b.name.localeCompare(a.name));
    else if (filters.sortBy === 'price_high') items.sort((a, b) => (b.pricereal || b.pricelatest || 0) - (a.pricereal || a.pricelatest || 0));
    else if (filters.sortBy === 'price_low') items.sort((a, b) => (a.pricereal || a.pricelatest || 0) - (b.pricereal || b.pricelatest || 0));
    return items;
  }, [inventory, filters]);

  useEffect(() => { setCurrentPage(1); }, [filters]);

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInventory = filteredInventory.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  // --- RENDER ---
  if (isLoading && !user) return <div className="text-center p-10 text-white">Loading Profile...</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center text-gray-400">Please login to view your profile.</div>;

  const activeListings = myListings.filter(l => ACTIVE_STATUSES.has(l.status));

  return (
    <div className="min-h-screen bg-cs-dark py-8 pb-20">

      {/* INSPECT MODAL */}
      {inspectingItem && (
        <InspectModal item={inspectingItem} onClose={() => setInspectingItem(null)} />
      )}

      {/* SELL MODAL */}
      {sellTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-white">List for Sale</h2>
              <button onClick={() => setSellTarget(null)} className="text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-3 mb-5 p-3 bg-slate-800 rounded-xl">
              <img
                src={sellTarget.image}
                alt={sellTarget.name}
                className="w-16 h-16 object-contain rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{sellTarget.name}</p>
                {sellTarget.float?.floatvalue && (
                  <p className="text-xs text-yellow-400 font-mono mt-0.5">
                    Float: {sellTarget.float.floatvalue.toFixed(6)}
                  </p>
                )}
                {(sellTarget.pricereal || sellTarget.pricelatest) && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Market: ${(sellTarget.pricereal || sellTarget.pricelatest)!.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm text-gray-300 mb-1.5 block font-medium">Your Price (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  step="0.01"
                  min="0.50"
                  max="10000"
                  placeholder="0.00"
                  value={sellPrice}
                  onChange={e => setSellPrice(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Min $0.50 · Max $10,000 · 5% platform fee applies</p>
            </div>

            {sellPrice && parseFloat(sellPrice) >= 0.50 && (
              <div className="bg-slate-800 rounded-lg p-3 mb-4 text-xs text-gray-300">
                <div className="flex justify-between mb-1">
                  <span>Listing price</span>
                  <span>${parseFloat(sellPrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-1 text-red-400">
                  <span>Platform fee (5%)</span>
                  <span>-${(parseFloat(sellPrice) * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-green-400 border-t border-slate-700 pt-1 mt-1">
                  <span>You receive</span>
                  <span>${(parseFloat(sellPrice) * 0.95).toFixed(2)}</span>
                </div>
              </div>
            )}

            {!user.trade_link && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4 text-xs text-yellow-300">
                ⚠️ Add your Steam Trade URL in Settings so buyers can send trades.
              </div>
            )}

            <button
              onClick={handleSellSubmit}
              disabled={isSelling || !sellPrice || parseFloat(sellPrice) < 0.50}
              className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition"
            >
              {isSelling ? 'Listing...' : 'List for Sale'}
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4">

        {/* HEADER */}
        <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <img src={user.avatar_url} alt="Profile" className="w-24 h-24 rounded-full border-4 border-slate-800" />
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{user.username}</h1>
              <a
                href={`https://steamcommunity.com/profiles/${user.steam_id}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-gray-400 hover:underline flex items-center gap-1"
              >
                Steam ID: {user.steam_id} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <div className="flex gap-4">
            {activeListings.length > 0 && (
              <div className="bg-slate-800 px-5 py-3 rounded-xl border border-slate-700 text-right">
                <p className="text-xs text-gray-500 uppercase font-bold">Active Listings</p>
                <p className="text-2xl font-bold text-blue-400">{activeListings.length}</p>
              </div>
            )}
            <div className="bg-slate-800 px-6 py-3 rounded-xl border border-slate-700 text-right">
              <p className="text-xs text-gray-500 uppercase font-bold">Wallet Balance</p>
              <p className="text-2xl font-bold text-yellow-400">${(user.balance / 100).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* SIDEBAR */}
          <div className="w-full lg:w-64 shrink-0">
            <nav className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              {[
                { id: 'overview',  icon: LayoutDashboard, label: 'Dashboard',     badge: 0 },
                { id: 'inventory', icon: Package,         label: 'My Inventory',  badge: 0 },
                { id: 'listings',  icon: Tag,             label: 'My Listings',   badge: activeListings.length },
                { id: 'history',   icon: History,         label: 'Trade History', badge: 0 },
                { id: 'wallet',    icon: Wallet,          label: 'Wallet',        badge: 0 },
                { id: 'settings',  icon: Settings,        label: 'Settings',      badge: 0 },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ProfileTab)}
                  className={`w-full flex items-center justify-between px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-600/10 text-blue-500 border-r-4 border-blue-500'
                      : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </div>
                  {item.badge > 0 && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{item.badge}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* CONTENT */}
          <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 p-6">

            {/* INVENTORY TAB */}
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
                  onChange={newFilters => setFilters(prev => ({ ...prev, ...(newFilters as Partial<IFilters>) }))}
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
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                      {paginatedInventory.map(item => {
                        const isListed = activeListingAssetIds.has(item.assetid);
                        return (
                          <div key={item.assetid} className="group">
                            <div
                              onClick={() => setInspectingItem(item)}
                              className="mb-2 transition-transform hover:-translate-y-1 cursor-pointer"
                            >
                              <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-blue-500 transition h-full flex flex-col">
                                <div className="aspect-square bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-contain"
                                    onError={e => {
                                      (e.target as HTMLImageElement).src =
                                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23334155' width='200' height='200'/%3E%3C/svg%3E";
                                    }}
                                  />
                                </div>
                                <div className="p-3 flex-1 flex flex-col">
                                  <div className="text-sm font-semibold mb-1 truncate" style={{ color: item.rarity_color || '#fff' }}>
                                    {item.name}
                                  </div>
                                  <div className="h-5 mb-1">
                                    {item.float?.floatvalue && (
                                      <div className="text-xs text-yellow-400 font-mono">
                                        Float: {item.float.floatvalue.toFixed(4)}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-green-400 font-bold text-sm mt-auto">
                                    {item.pricereal
                                      ? `$${item.pricereal}`
                                      : item.pricelatest
                                      ? `$${item.pricelatest}`
                                      : 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {isListed ? (
                              <div className="flex gap-1">
                                <div className="flex-1 text-center text-xs font-bold py-2 bg-blue-900/40 text-blue-400 rounded">
                                  Listed
                                </div>
                                <button
                                  onClick={async () => {
                                    const listing = myListings.find(l => l.assetid === item.assetid && l.status === 'listed');
                                    if (listing) await handleCancelListing(listing);
                                  }}
                                  className="px-2 text-xs font-bold py-2 bg-red-600/70 hover:bg-red-600 text-white rounded transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => openSellModal(item)}
                                className="w-full text-xs font-bold py-2 bg-green-700/80 hover:bg-green-600 text-white rounded transition"
                              >
                                Sell
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {paginatedInventory.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                          {inventory.length > 0 ? 'No items match your filters.' : 'Your inventory is empty.'}
                        </div>
                      )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 pt-6">
                        <div className="text-sm text-slate-400">
                          Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredInventory.length)} of {filteredInventory.length} items
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 rounded-lg font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:text-slate-600 disabled:cursor-not-allowed transition"
                          >
                            Previous
                          </button>
                          <div className="hidden sm:flex items-center gap-1">
                            {getPageNumbers().map((p, i) =>
                              p === '...' ? (
                                <span key={`e-${i}`} className="px-3 py-2 text-slate-600">...</span>
                              ) : (
                                <button
                                  key={p}
                                  onClick={() => setCurrentPage(p as number)}
                                  className={`px-3 py-2 rounded-lg font-medium transition ${
                                    currentPage === p
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                                  }`}
                                >
                                  {p}
                                </button>
                              )
                            )}
                          </div>
                          <div className="sm:hidden px-4 py-2 bg-slate-800 rounded-lg text-sm text-white">
                            Page {currentPage} / {totalPages}
                          </div>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 rounded-lg font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:text-slate-600 disabled:cursor-not-allowed transition"
                          >
                            Next
                          </button>
                        </div>
                        <div className="hidden lg:block text-sm text-slate-400">{itemsPerPage} per page</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* MY LISTINGS TAB */}
            {activeTab === 'listings' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">My Listings</h2>
                  <button
                    onClick={refreshListings}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>

                {myListings.length === 0 ? (
                  <div className="text-center py-16 text-gray-500 border-2 border-dashed border-slate-700 rounded-xl">
                    <Tag className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-lg font-semibold mb-1">No listings yet</p>
                    <p className="text-sm">
                      Go to your inventory and click{' '}
                      <span className="text-green-400 font-semibold">Sell</span> to list items.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myListings.map(listing => {
                      const statusInfo = STATUS_LABELS[listing.status] || { label: listing.status, color: 'text-gray-400' };
                      return (
                        <div
                          key={listing.id}
                          className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 transition"
                        >
                          <img
                            src={listing.image_url}
                            alt={listing.name}
                            className="w-14 h-14 object-contain rounded-lg bg-slate-700/50 p-1 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{listing.name}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className={`text-xs font-semibold ${statusInfo.color}`}>
                                ● {statusInfo.label}
                              </span>
                              {listing.float_value && (
                                <span className="text-xs text-yellow-400/70 font-mono">
                                  {parseFloat(listing.float_value).toFixed(4)}
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {new Date(listing.listed_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-green-400 font-bold text-lg">${parseFloat(listing.price).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">
                              You receive: ${(parseFloat(listing.price) * 0.95).toFixed(2)}
                            </p>
                          </div>
                          {listing.status === 'listed' && (
                            <button
                              onClick={() => handleCancelListing(listing)}
                              className="px-3 py-1.5 text-xs font-bold text-red-400 hover:text-white hover:bg-red-600 border border-red-600/40 rounded-lg transition shrink-0"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
                <TradeUrlSettings user={user} onSave={updatedUser => setUser(updatedUser)} />
              </div>
            )}

            {/* OTHER TABS */}
            {activeTab !== 'inventory' && activeTab !== 'listings' && activeTab !== 'settings' && (
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

// --- Trade URL Settings sub-component ---
function TradeUrlSettings({ user, onSave }: { user: User; onSave: (u: User) => void }) {
  const [tradeUrl, setTradeUrl] = useState(user.trade_link || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('http://localhost:8080/api/user/trade-url', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ trade_link: tradeUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        onSave(data.user);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg">
      <label className="text-sm text-gray-300 mb-1.5 block font-medium">Steam Trade URL</label>
      <input
        type="url"
        placeholder="https://steamcommunity.com/tradeoffer/new/?partner=..."
        value={tradeUrl}
        onChange={e => setTradeUrl(e.target.value)}
        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition mb-2"
      />
      <p className="text-xs text-gray-500 mb-4">
        <a
          href="https://steamcommunity.com/id/me/tradeoffers/privacy"
          target="_blank"
          rel="noreferrer"
          className="text-blue-400 hover:underline"
        >
          Find your trade URL on Steam
        </a>
      </p>
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-lg font-semibold transition"
      >
        {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Trade URL'}
      </button>
    </div>
  );
}
