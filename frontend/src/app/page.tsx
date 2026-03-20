"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Zap, ChevronRight, TrendingUp, Tag, Users, ArrowRight, Flame } from 'lucide-react';

interface MarketListing {
  id: string;
  assetid: string;
  name: string;
  image_url: string;
  rarity_color: string;
  float_value: string | null;
  price: string;
  views: number;
  seller: {
    username: string;
    avatar_url: string;
    steam_id: string;
  };
}

const MOCK_NEWS = [
  "🔥  New 'Kilowatt' case skins are now trading on SkinCity — check the marketplace!",
  "💎  StatTrak™ AWP | Dragon Lore just listed for $3,200 — be quick!",
  "📈  CS2 skin prices up 8% this week — great time to sell.",
  "🛡️  All trades protected by 7-day escrow — trade with confidence.",
  "🎮  Inventory sync now supports all CS2 operations cases.",
];

function ListingCard({ listing, onClick }: { listing: MarketListing; onClick?: () => void }) {
  return (
    <Link
      href="/traders"
      className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all flex flex-col"
    >
      <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4 relative">
        <img
          src={listing.image_url}
          alt={listing.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
        />
        {listing.views > 0 && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-xs text-gray-300 px-1.5 py-0.5 rounded flex items-center gap-1">
            <span className="text-gray-400">👁</span> {listing.views}
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs font-semibold truncate mb-1" style={{ color: listing.rarity_color || '#fff' }}>
          {listing.name}
        </p>
        {listing.float_value && (
          <p className="text-xs text-yellow-400/70 font-mono mb-1">
            {parseFloat(listing.float_value).toFixed(4)}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between">
          <p className="text-green-400 font-bold">${parseFloat(listing.price).toFixed(2)}</p>
          <div className="flex items-center gap-1">
            <img src={listing.seller.avatar_url} alt="" className="w-4 h-4 rounded-full" />
            <span className="text-xs text-gray-500 truncate max-w-[60px]">{listing.seller.username}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-slate-800" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-slate-800 rounded w-3/4" />
        <div className="h-3 bg-slate-800 rounded w-1/2" />
        <div className="h-4 bg-slate-800 rounded w-1/3 mt-2" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [newsIndex, setNewsIndex] = useState(0);
  const [newsVisible, setNewsVisible] = useState(true);
  const [recentListings, setRecentListings] = useState<MarketListing[]>([]);
  const [hotListings, setHotListings] = useState<MarketListing[]>([]);
  const [totalListings, setTotalListings] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // News ticker with fade transition
  useEffect(() => {
    const interval = setInterval(() => {
      setNewsVisible(false);
      setTimeout(() => {
        setNewsIndex(prev => (prev + 1) % MOCK_NEWS.length);
        setNewsVisible(true);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recentRes, hotRes] = await Promise.all([
          fetch('http://localhost:8080/api/market?sort=listed_at_desc&page=1'),
          fetch('http://localhost:8080/api/market?sort=views_desc&page=1'),
        ]);
        if (recentRes.ok) {
          const data = await recentRes.json();
          setRecentListings(data.listings.slice(0, 6));
          setTotalListings(data.total);
        }
        if (hotRes.ok) {
          const data = await hotRes.json();
          // Only show hot items with at least 1 view; fallback to price_asc if none
          const withViews = data.listings.filter((l: MarketListing) => l.views > 0);
          setHotListings(withViews.slice(0, 6));
        }
      } catch (e) {
        console.error('Homepage fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-cs-dark">

      {/* HERO */}
      <div className="relative h-[520px] bg-slate-900 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: "url('https://files.bo3.gg/uploads/news/31034/title_image/960x480-155e729a88f4e2f9392d409074b12743.webp')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />

        <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-blue-300 font-medium">Live Marketplace — {totalListings ?? '...'} items available</span>
            </div>
            <h1 className="text-6xl font-black text-white mb-4 leading-tight tracking-tight">
              TRADE SKINS.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                SECURELY.
              </span>
            </h1>
            <p className="text-lg text-gray-400 mb-8 max-w-xl">
              Bulgaria's #1 CS2 skin trading platform. P2P trades with 7-day escrow protection, real float data, and zero hassle.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/traders"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-600/20"
              >
                Browse Market <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all border border-slate-700"
              >
                Sell Your Skins
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* NEWS TICKER */}
      <div className="bg-slate-900 border-y border-slate-800 py-3">
        <div className="container mx-auto px-4 flex items-center gap-4">
          <div className="shrink-0 flex items-center gap-2 bg-blue-600 px-3 py-1 rounded text-xs font-bold text-white uppercase tracking-wider">
            <TrendingUp className="w-3 h-3" />
            Live
          </div>
          <p
            className="text-sm text-gray-300 transition-opacity duration-300"
            style={{ opacity: newsVisible ? 1 : 0 }}
          >
            {MOCK_NEWS[newsIndex]}
          </p>
        </div>
      </div>

      {/* STATS BAR */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="container mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Tag,      label: 'Items Listed',    value: totalListings != null ? totalListings.toLocaleString() : '—' },
            { icon: Shield,   label: 'Escrow Protected', value: '100%' },
            { icon: Zap,      label: 'Platform Fee',    value: '5%' },
            { icon: Users,    label: 'Community',       value: 'Growing' },
          ].map(stat => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center shrink-0">
                <stat.icon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-bold text-lg leading-tight">{stat.value}</p>
                <p className="text-gray-500 text-xs">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENTLY ADDED */}
      <div className="py-14 container mx-auto px-4">
        <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-5">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Recently Added</h2>
            <p className="text-gray-400 text-sm">Fresh listings from the community</p>
          </div>
          <Link href="/traders" className="flex items-center gap-1 text-blue-500 hover:text-blue-400 font-medium text-sm transition-colors">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : recentListings.length > 0
            ? recentListings.map(l => <ListingCard key={l.id} listing={l} />)
            : (
              <div className="col-span-full text-center py-16 text-gray-500 border-2 border-dashed border-slate-800 rounded-2xl">
                <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold mb-1">No listings yet</p>
                <p className="text-sm">Be the first —{' '}
                  <Link href="/profile" className="text-blue-400 hover:underline">list an item</Link>
                </p>
              </div>
            )
          }
        </div>
      </div>

      {/* HOT OFFERS */}
      {(loading || hotListings.length > 0) && (
        <div className="py-14 bg-slate-900/50 border-t border-slate-800">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <h2 className="text-3xl font-bold text-white">Hot Offers</h2>
                </div>
                <p className="text-gray-400 text-sm">Most viewed items right now</p>
              </div>
              <Link href="/traders?sort=views_desc" className="flex items-center gap-1 text-blue-500 hover:text-blue-400 font-medium text-sm transition-colors">
                See More <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                : hotListings.map(l => <ListingCard key={l.id} listing={l} />)
              }
            </div>
          </div>
        </div>
      )}

      {/* HOW IT WORKS */}
      <div className="py-20 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">How It Works</h2>
          <p className="text-gray-400">Trade safely in 3 simple steps</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              step: '01',
              icon: Tag,
              title: 'List Your Item',
              desc: 'Connect your Steam account, pick an item from your inventory and set your price.',
              color: 'text-blue-400',
              bg: 'bg-blue-600/10',
            },
            {
              step: '02',
              icon: Shield,
              title: 'Buyer Purchases',
              desc: 'A buyer confirms the purchase. Funds go into 7-day escrow while you send the item.',
              color: 'text-green-400',
              bg: 'bg-green-600/10',
            },
            {
              step: '03',
              icon: Zap,
              title: 'Get Paid',
              desc: 'Once the trade is confirmed, funds are released to your wallet. Fast and secure.',
              color: 'text-purple-400',
              bg: 'bg-purple-600/10',
            },
          ].map(item => (
            <div key={item.step} className="relative text-center p-8 bg-slate-900 rounded-2xl border border-slate-800">
              <div className="absolute top-4 right-4 text-5xl font-black text-slate-800 select-none">
                {item.step}
              </div>
              <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
                <item.icon className={`w-7 h-7 ${item.color}`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA BANNER */}
      <div className="pb-20 container mx-auto px-4">
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-2xl p-10 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to start trading?</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Join the SkinCity marketplace. List your skins, find great deals, and trade with full escrow protection.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/traders"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all"
            >
              Browse Listings <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold border border-slate-700 transition-all"
            >
              List an Item
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
