// frontend/src/app/traders/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SkinCard from '../components/SkinCard';

interface ListedItemWithOwner {
  id: string;
  assetid: string;
  name: string;
  image_url: string;
  rarity_color: string;
  owner: {
    username: string;
    avatar_url: string;
    steam_id: string;
  };
}

export default function TradersPage() {
  const [listings, setListings] = useState<ListedItemWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/api/showcase/all');
        if (response.ok) {
          const data = await response.json();
          setListings(data);
        } else {
          setError("Failed to load listings from the server.");
        }
      } catch (err) {
        setError("Could not connect to the server.");
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  if (loading) {
    return <div className="text-center p-10">Loading active trades...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4">
      <div className="border-b border-slate-800 pb-4 mb-8">
        <h1 className="text-4xl font-bold text-white">Trade Listings</h1>
        <p className="text-gray-400 mt-2">Browse items listed by other users. Click "Make Offer" to start a trade.</p>
      </div>

      {listings.length === 0 ? (
        <p className="text-gray-400">No items are currently listed for trade. Be the first by listing an item from your profile!</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {listings.map((listing) => (
            <div key={listing.id} className="bg-slate-800 border border-slate-700 rounded-lg flex flex-col justify-between h-full">
              {}
              <SkinCard
                skin={{
                  assetid: listing.assetid,
                  name: listing.name,
                  image: listing.image_url,
                  rarity_color: listing.rarity_color,
                }}
                actionLabel=""
                onAction={() => {}}
              />
              {}
              <div className="p-3 border-t border-slate-700">
                <a 
                  href={`https://steamcommunity.com/profiles/${listing.owner.steam_id}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 mb-3"
                >
                  <img src={listing.owner.avatar_url} alt={listing.owner.username} className="w-6 h-6 rounded-full" />
                  <span className="text-xs text-gray-300 hover:text-white truncate">{listing.owner.username}</span>
                </a>
                
                {}
                <Link href={`/trade/offer/${listing.id}`} passHref>
                  <button className="w-full px-2 py-1 text-xs font-bold text-white rounded bg-blue-600 hover:bg-blue-700">
                    Make Offer
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}