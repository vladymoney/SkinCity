"use client";

import React, { useEffect, useState } from 'react';
import { X, Loader2, TrendingUp, Tag, ExternalLink, ShoppingCart, User } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface MarketListing {
  id: string;
  assetid: string;
  name: string;
  image_url: string;
  rarity_color: string;
  float_value: string | null;
  stickers?: any;
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

interface Props {
  listing: MarketListing;
  currentUserId?: string;
  onClose: () => void;
  onPurchaseSuccess?: () => void;
}

type TimePeriod = '24h' | '7d' | '30d' | '90d';

const FLOAT_WEAR = [
  { name: 'Factory New',   max: 0.07,  color: '#4ade80' },
  { name: 'Minimal Wear',  max: 0.15,  color: '#22c55e' },
  { name: 'Field-Tested',  max: 0.38,  color: '#eab308' },
  { name: 'Well-Worn',     max: 0.45,  color: '#f97316' },
  { name: 'Battle-Scarred', max: 1.00, color: '#ef4444' },
];

function getWear(float: number) {
  return FLOAT_WEAR.find(w => float < w.max) ?? FLOAT_WEAR[4];
}

export default function MarketListingModal({ listing, currentUserId, onClose, onPurchaseSuccess }: Props) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d');
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Purchase form state
  const [buyerTradeUrl, setBuyerTradeUrl] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<{ seller_trade_url?: string; instructions?: string } | null>(null);

  const floatNum = listing.float_value ? parseFloat(listing.float_value) : null;
  const wear = floatNum !== null ? getWear(floatNum) : null;
  const isOwnListing = currentUserId === listing.seller_id;
  const listingPrice = parseFloat(listing.price);

  // Load price history
  useEffect(() => {
    const load = async () => {
      setHistoryLoading(true);
      try {
        const res = await fetch(`http://localhost:8080/api/steam/history?name=${encodeURIComponent(listing.name)}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setPriceHistory(data);
      } catch {
        /* silently fail */
      } finally {
        setHistoryLoading(false);
      }
    };
    load();
  }, [listing.name]);

  // Build chart data
  const chartData = (() => {
    if (!priceHistory.length) return null;
    const maxPoints = { '24h': 24, '7d': 50, '30d': 90, '90d': 180 }[timePeriod];
    const sorted = [...priceHistory]
      .sort((a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime())
      .slice(0, maxPoints)
      .reverse();
    if (!sorted.length) return null;
    return {
      labels: sorted.map(p =>
        new Date(p.createdat).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      datasets: [{
        label: 'Price',
        data: sorted.map(p => (typeof p.price === 'number' ? p.price : parseFloat(p.price))),
        borderColor: '#4ade80',
        backgroundColor: (ctx: any) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260);
          gradient.addColorStop(0, 'rgba(74,222,128,0.15)');
          gradient.addColorStop(1, 'rgba(74,222,128,0)');
          return gradient;
        },
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#4ade80',
        fill: true,
        tension: 0.4,
      }],
    };
  })();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)',
        padding: 10,
        titleColor: '#94a3b8',
        bodyColor: '#4ade80',
        bodyFont: { size: 14, weight: 'bold' as const },
        displayColors: false,
        callbacks: { label: (ctx: any) => `$${ctx.parsed.y.toFixed(2)}` },
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 7, autoSkip: true } },
      y: { grid: { color: 'rgba(71,85,105,0.2)' }, border: { display: false }, ticks: { color: '#64748b', font: { size: 11 }, callback: (v: any) => `$${v.toFixed(0)}` } },
    },
    interaction: { mode: 'index' as const, intersect: false },
  };

  const handlePurchase = async () => {
    if (!buyerTradeUrl.trim()) return;
    setPurchasing(true);
    try {
      const res = await fetch(`http://localhost:8080/api/market/${listing.id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ buyer_trade_url: buyerTradeUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setPurchaseResult(data);
        onPurchaseSuccess?.();
      } else {
        alert(data.message || 'Purchase failed');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">{listing.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              {wear && (
                <span className="text-xs font-semibold" style={{ color: wear.color }}>{wear.name}</span>
              )}
              <span className="text-xs text-gray-500">{listing.views} views</span>
              <span className="text-xs text-gray-500">Listed {new Date(listing.listed_at).toLocaleDateString()}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition">
            <X size={22} />
          </button>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* LEFT: Image + Listing Details */}
            <div className="flex flex-col gap-5">

              {/* Image */}
              <div className="aspect-[4/3] bg-gradient-to-br from-slate-950 to-slate-800 rounded-xl flex items-center justify-center p-8 border border-slate-800 relative">
                <img
                  src={listing.image_url}
                  alt={listing.name}
                  className="max-w-full max-h-full object-contain drop-shadow-2xl"
                  onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
                />
                <div className="absolute top-3 right-3 text-[10px] text-slate-600 bg-black/40 px-2 py-1 rounded">2D Icon</div>
              </div>

              {/* Float + Listing Price row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <p className="text-xs uppercase font-bold text-slate-500 mb-1">Listing Price</p>
                  <p className="text-2xl font-bold text-green-400">${listingPrice.toFixed(2)}</p>
                  <p className="text-xs text-gray-600 mt-0.5">You receive: ${(listingPrice * 0.95).toFixed(2)}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <p className="text-xs uppercase font-bold text-slate-500 mb-1">Float Value</p>
                  {floatNum !== null ? (
                    <>
                      <p className="text-xl font-bold font-mono" style={{ color: wear?.color ?? '#fff' }}>
                        {floatNum.toFixed(4)}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: wear?.color ?? '#888' }}>{wear?.name}</p>
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm mt-2">N/A</p>
                  )}
                </div>
              </div>

              {/* Float bar */}
              {floatNum !== null && (
                <div>
                  <div className="h-2 rounded-full overflow-hidden relative bg-gradient-to-r from-green-500 via-yellow-400 to-red-500">
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg shadow-white/50"
                      style={{ left: `${floatNum * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>FN 0.00</span>
                    <span>MW 0.07</span>
                    <span>FT 0.15</span>
                    <span>WW 0.38</span>
                    <span>BS 0.45</span>
                    <span>1.00</span>
                  </div>
                </div>
              )}

              {/* Stickers */}
              {listing.stickers && Array.isArray(listing.stickers) && listing.stickers.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-3 flex items-center gap-1">
                    <Tag size={12} /> Stickers ({listing.stickers.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {listing.stickers.map((s: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-300">
                        {s.image && <img src={s.image} alt={s.name} className="w-5 h-5 object-contain" />}
                        {s.name || `Sticker ${i + 1}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seller info */}
              <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                <img src={listing.seller.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{listing.seller.username}</p>
                  <p className="text-xs text-gray-500">Seller</p>
                </div>
                <a
                  href={`https://steamcommunity.com/profiles/${listing.seller.steam_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* RIGHT: Price Chart + Buy */}
            <div className="flex flex-col gap-5">

              {/* Price History Chart */}
              <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 flex flex-col overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/30">
                  <div className="flex items-center gap-2 text-slate-300">
                    <TrendingUp size={16} className="text-green-400" />
                    <span className="text-sm font-semibold">Market Price History</span>
                  </div>
                  <div className="flex gap-1 bg-slate-950/50 rounded-lg p-0.5 border border-slate-700/30">
                    {(['24h', '7d', '30d', '90d'] as TimePeriod[]).map(p => (
                      <button
                        key={p}
                        onClick={() => setTimePeriod(p)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded transition ${
                          timePeriod === p ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4" style={{ height: 220 }}>
                  {historyLoading ? (
                    <div className="flex items-center justify-center h-full text-slate-500 gap-2 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                    </div>
                  ) : chartData ? (
                    <Line data={chartData} options={chartOptions} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <TrendingUp className="w-10 h-10 mb-2 opacity-25" />
                      <p className="text-sm">No price history available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Buy section */}
              {purchaseResult ? (
                <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-5 text-center">
                  <div className="text-4xl mb-3">✅</div>
                  <h3 className="text-lg font-bold text-white mb-1">Purchase Initiated!</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Funds are in escrow for 7 days. Wait for the seller to send the item.
                  </p>
                  {purchaseResult.seller_trade_url && (
                    <div className="bg-slate-900 rounded-lg p-3 mb-4 text-left">
                      <p className="text-xs text-gray-400 mb-1 font-semibold uppercase">Seller's Trade URL</p>
                      <a
                        href={purchaseResult.seller_trade_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 text-xs break-all hover:underline flex items-start gap-1"
                      >
                        <ExternalLink className="w-3 h-3 mt-0.5 shrink-0" />
                        {purchaseResult.seller_trade_url}
                      </a>
                    </div>
                  )}
                  {purchaseResult.instructions && (
                    <p className="text-xs text-yellow-400/80 bg-yellow-500/10 rounded-lg p-3 mb-4">{purchaseResult.instructions}</p>
                  )}
                  <button onClick={onClose} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition">
                    Close
                  </button>
                </div>
              ) : isOwnListing ? (
                <div className="bg-slate-800/20 rounded-xl border border-slate-700 p-5 text-center text-gray-400">
                  <p className="font-semibold mb-1">This is your listing</p>
                  <p className="text-sm">You cannot buy your own item.</p>
                </div>
              ) : (
                <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold">Buy for</p>
                      <p className="text-3xl font-black text-green-400">${listingPrice.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">5% platform fee · Escrow 7 days</p>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-green-400/30" />
                  </div>

                  <div>
                    <label className="text-xs text-gray-300 font-semibold mb-1.5 block">Your Steam Trade URL</label>
                    <input
                      type="url"
                      placeholder="https://steamcommunity.com/tradeoffer/new/?partner=..."
                      value={buyerTradeUrl}
                      onChange={e => setBuyerTradeUrl(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      <a href="https://steamcommunity.com/id/me/tradeoffers/privacy" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                        Find your trade URL on Steam
                      </a>
                    </p>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-300">
                    ⚠️ Funds held in escrow for 7 days after purchase. The seller will send the item to your trade URL.
                  </div>

                  <button
                    onClick={handlePurchase}
                    disabled={purchasing || !buyerTradeUrl.trim()}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition text-lg"
                  >
                    {purchasing ? 'Processing...' : `Buy Now — $${listingPrice.toFixed(2)}`}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
