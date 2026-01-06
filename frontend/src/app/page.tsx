// frontend/src/app/page.tsx

"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link'; // Use Next.js Link
import { Shield, Users, RefreshCw, ChevronRight, TrendingUp } from 'lucide-react';
import SkinCard from './components/SkinCard'; // Import our existing SkinCard

// Define the shape of the data from our backend
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

// Mock data for the news ticker, as we don't have this in the backend yet
const MOCK_MARKET_NEWS = [
  "BREAKING: New 'Kilowatt' case sees record opening numbers.",
  "RARE FIND: A StatTrak AK-47 | Case Hardened with a blue gem pattern was just listed.",
  "PRICE ALERT: AWP | Dragon Lore prices are up 5% this week.",
];

export default function HomePage() {
  const [newsIndex, setNewsIndex] = useState(0);
  const [recentListings, setRecentListings] = useState<ListedItemWithOwner[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  // Cycle news ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setNewsIndex((prev) => (prev + 1) % MOCK_MARKET_NEWS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch recently listed items from our backend
  useEffect(() => {
    const fetchRecentListings = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/showcase/all?limit=4'); // We can add a limit later
        if (response.ok) {
          const allListings = await response.json();
          // The API returns most recent first, so we just take the first 4
          setRecentListings(allListings.slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to fetch recent listings", error);
      } finally {
        setLoadingListings(false);
      }
    };
    fetchRecentListings();
  }, []);
  
  return (
    <div className="min-h-screen bg-cs-dark">
      {/* Hero Section */}
      <div className="relative h-[500px] bg-slate-900 overflow-hidden">
        {/* You can find a cool background image for CS2 and replace the picsum URL */}
        <div className="absolute inset-0 bg-[url('https://files.bo3.gg/uploads/news/31034/title_image/960x480-155e729a88f4e2f9392d409074b12743.webp')] opacity-20 bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10">
          <h1 className="text-6xl font-bold text-white mb-4 leading-tight">
            TRADE SKINS.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">SECURELY.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mb-8">
            The most advanced CS2 trading platform. Direct P2P trading with a focus on security and transparency.
          </p>
          <div className="flex gap-4">
            <Link href="/traders" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all">
              Browse Trades
            </Link>
            <Link href="/profile" className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all border border-slate-700">
              My Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Market News Ticker */}
      <div className="bg-slate-900 border-y border-slate-800 py-3 overflow-hidden">
          {/* ... (This section is great as-is) ... */}
      </div>

      {/* Features */}
      <div className="py-20 bg-cs-dark">
          {/* ... (This section is great as-is) ... */}
      </div>

      {/* Recently Listed */}
      <div className="py-10 container mx-auto px-4">
        <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Recently Added</h2>
            <p className="text-gray-400">Fresh listings from the community</p>
          </div>
          <Link href="/traders" className="flex items-center text-blue-500 hover:text-blue-400 font-medium transition-colors">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        {loadingListings ? (
          <p>Loading recent items...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentListings.map(listing => (
              // Adapt the SkinCard props to match our data
              <SkinCard 
                key={listing.id} 
                skin={{
                    assetid: listing.assetid,
                    name: listing.name,
                    image: listing.image_url,
                    rarity_color: listing.rarity_color
                }} 
                actionLabel="Make Offer"
                onAction={() => {  }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};