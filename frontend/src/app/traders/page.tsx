"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Tag } from 'lucide-react';
import MarketListingModal from '../components/MarketListingModal';

interface MarketListing {
  id: string;
  assetid: string;
  name: string;
  image_url: string;
  rarity_color: string;
  float_value: string | null;
  price: string;
  status: string;
  seller_id: string;
  seller_trade_url: string | null;
  views: number;
  listed_at: string;
  seller: {
    username: string;
    avatar_url: string;
    steam_id: string;
  };
}

export default function MarketPage() {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('listed_at_desc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [user, setUser] = useState<{ id: string; trade_link?: string } | null>(null);
  const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), sort });
      if (search) params.set('search', search);
      if (minPrice) params.set('min_price', minPrice);
      if (maxPrice) params.set('max_price', maxPrice);
      const res = await fetch(`http://localhost:8080/api/market?${params}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings);
        setTotal(data.total);
        setPages(data.pages);
      }
    } catch (e) {
      console.error('Failed to fetch listings', e);
    } finally {
      setLoading(false);
    }
  }, [page, sort, search, minPrice, maxPrice]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  useEffect(() => {
    fetch('http://localhost:8080/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(setUser)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-cs-dark py-8">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="mb-8 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Tag className="w-7 h-7 text-blue-500" />
            <h1 className="text-4xl font-bold text-white">Marketplace</h1>
          </div>
          <p className="text-gray-400">
            {loading ? 'Loading...' : `${total} item${total !== 1 ? 's' : ''} for sale`}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search skins..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={sort}
            onChange={e => { setSort(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="listed_at_desc">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="float_asc">Float: Low to High</option>
            <option value="float_desc">Float: High to Low</option>
          </select>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">$</span>
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={e => { setMinPrice(e.target.value); setPage(1); }}
              className="w-20 px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <span className="text-gray-500">–</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
              className="w-20 px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-24 text-gray-400">Loading listings...</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24 text-gray-500 border-2 border-dashed border-slate-700 rounded-2xl">
            <p className="text-xl font-semibold mb-2">No listings found</p>
            <p className="text-sm">Try adjusting your filters, or list an item from your profile!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {listings.map(listing => {
              const isOwnListing = user?.id === listing.seller_id;
              return (
                <div
                  key={listing.id}
                  onClick={() => setSelectedListing(listing)}
                  className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all group flex flex-col cursor-pointer"
                >
                  <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-3 relative">
                    <img
                      src={listing.image_url}
                      alt={listing.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
                    />
                    {listing.views > 0 && (
                      <div className="absolute top-2 right-2 bg-black/50 text-xs text-gray-400 px-1.5 py-0.5 rounded">
                        👁 {listing.views}
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <p
                      className="text-xs font-semibold truncate mb-1"
                      style={{ color: listing.rarity_color || '#fff' }}
                    >
                      {listing.name}
                    </p>
                    {listing.float_value && (
                      <p className="text-xs text-yellow-400/70 font-mono mb-1">
                        {parseFloat(listing.float_value).toFixed(4)}
                      </p>
                    )}
                    <div className="mt-auto">
                      <p className="text-green-400 font-bold text-sm mb-2">
                        ${parseFloat(listing.price).toFixed(2)}
                      </p>
                      <div className="flex items-center gap-1 mb-2">
                        <img
                          src={listing.seller.avatar_url}
                          alt={listing.seller.username}
                          className="w-4 h-4 rounded-full"
                        />
                        <span className="text-xs text-gray-500 truncate">{listing.seller.username}</span>
                      </div>
                      <div
                        onClick={e => { e.stopPropagation(); setSelectedListing(listing); }}
                        className={`w-full text-xs font-bold py-1.5 rounded text-center transition ${
                          isOwnListing
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                      >
                        {isOwnListing ? 'Your Listing' : 'View & Buy'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-40 hover:bg-slate-700 transition"
            >
              Previous
            </button>
            <span className="text-gray-400 text-sm">Page {page} of {pages}</span>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-40 hover:bg-slate-700 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Item Detail + Buy Modal */}
      {selectedListing && (
        <MarketListingModal
          listing={selectedListing}
          currentUserId={user?.id}
          onClose={() => setSelectedListing(null)}
          onPurchaseSuccess={fetchListings}
        />
      )}
    </div>
  );
}
