"use client";

import React, { useEffect, useState } from 'react';
import { X, Loader2, Gamepad2, Tag, TrendingUp } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface Props { 
  item: any; 
  onClose: () => void; 
}

const BACKEND_URL = "http://localhost:8080/api/steam";

type TimePeriod = '24h' | '7d' | '30d' | '90d';

export default function InspectModal({ item, onClose }: Props) {
  if (!item) return null;

  // --- STATE ---
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [is3D, setIs3D] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d');
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Extract data (already loaded from inventory!)
  const floatData = item.float;
  const inspectLink = item.inspect_link;
  const iconUrl = item.image;

  // --- LOAD 3D SCREENSHOT ---
  useEffect(() => {
    if (!inspectLink) {
      setScreenshotUrl(iconUrl);
      setImageLoading(false);
      setIs3D(false);
      return;
    }

    const loadScreenshot = async () => {
      setImageLoading(true);
      
      try {
        const url = `${BACKEND_URL}/float/screenshot?url=${encodeURIComponent(inspectLink)}`;
        const img = new Image();
        
        img.onload = () => {
          setScreenshotUrl(url);
          setIs3D(true);
          setImageLoading(false);
        };
        
        img.onerror = () => {
          console.warn("3D screenshot failed, using 2D icon");
          setScreenshotUrl(iconUrl);
          setIs3D(false);
          setImageLoading(false);
        };
        
        img.src = url;
      } catch (e) {
        console.error("Screenshot error:", e);
        setScreenshotUrl(iconUrl);
        setIs3D(false);
        setImageLoading(false);
      }
    };

    loadScreenshot();
  }, [item, inspectLink, iconUrl]);

  // --- LOAD PRICE HISTORY FROM API ---
  useEffect(() => {
    const loadHistory = async () => {
      if (!item.name) return;
      
      setHistoryLoading(true);
      
      try {
        const res = await fetch(`${BACKEND_URL}/history?name=${encodeURIComponent(item.name)}`);
        const data = await res.json();
        
        console.log("Price history response:", data);
        
        if (Array.isArray(data) && data.length > 0) {
          console.log("✅ Loaded", data.length, "price points");
          console.log("Sample data:", data[0]);
          setPriceHistory(data);
        } else {
          console.warn("No price history data");
          setPriceHistory([]);
        }
      } catch (e) {
        console.error("History API error:", e);
        setPriceHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };
    
    loadHistory();
  }, [item.name]);

  // --- BUILD CHART FROM API HISTORY DATA ---
  const getChartData = () => {
    if (!priceHistory || priceHistory.length === 0) {
      console.log("No price history available");
      return null;
    }

    const now = new Date();
    let maxPoints: number;

    // Set how many recent points to show
    switch (timePeriod) {
      case '24h':
        maxPoints = 24; // Last 24 data points
        break;
      case '7d':
        maxPoints = 50; // Last ~50 points (roughly weekly)
        break;
      case '30d':
        maxPoints = 90; // Last ~90 points (roughly monthly)
        break;
      case '90d':
        maxPoints = 180; // Last ~180 points (3 months)
        break;
    }

    // Sort by date (newest first) and take the most recent points
    const sorted = [...priceHistory].sort((a, b) => {
      const dateA = new Date(a.createdat).getTime();
      const dateB = new Date(b.createdat).getTime();
      return dateB - dateA; // Newest first
    });

    // Take the most recent N points, then reverse so oldest is first (for chart)
    const recent = sorted.slice(0, maxPoints).reverse();

    if (recent.length === 0) {
      console.log("No data available");
      return null;
    }

    console.log(`Using ${recent.length} most recent points for ${timePeriod}`);

    // Prepare chart data
    const labels = recent.map(item => {
      const date = new Date(item.createdat);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        ...(timePeriod === '90d' ? { year: '2-digit' } : {})
      });
    });

    const prices = recent.map(item => {
      return typeof item.price === 'number' ? item.price : parseFloat(item.price);
    });

    console.log("Chart data prepared:", { 
      points: prices.length, 
      range: [Math.min(...prices).toFixed(2), Math.max(...prices).toFixed(2)],
      dateRange: [recent[0].createdat, recent[recent.length - 1].createdat]
    });

    return {
      labels,
      datasets: [{
        label: 'Price (USD)',
        data: prices,
        borderColor: '#4ade80',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(74, 222, 128, 0.15)');
          gradient.addColorStop(1, 'rgba(74, 222, 128, 0)');
          return gradient;
        },
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#4ade80',
        pointHoverBorderColor: '#1e293b',
        pointHoverBorderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };
  };

  const chartData = getChartData();
  
  // Debug logging
  useEffect(() => {
    console.log("Chart render check:", {
      hasChartData: !!chartData,
      timePeriod,
      itemPrices: {
        latest: item.pricelatest,
        avg24h: item.priceavg24h,
        avg7d: item.priceavg7d,
        avg30d: item.priceavg30d,
        avg90d: item.priceavg90d
      }
    });
    
    if (chartData) {
      console.log("Chart data:", chartData);
    } else {
      console.log("⚠️ No chart data generated");
    }
  }, [chartData, timePeriod]);

  // --- CHART OPTIONS ---
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 12,
        titleColor: '#94a3b8',
        titleFont: { size: 11, weight: '400' as const },
        bodyColor: '#4ade80',
        bodyFont: { size: 14, weight: 'bold' as const },
        displayColors: false,
        borderColor: 'rgba(76, 175, 80, 0.3)',
        borderWidth: 1,
        callbacks: {
          title: function(context: any) {
            return context[0].label;
          },
          label: function(context: any) {
            return `$${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { 
          display: false
        },
        border: {
          display: false
        },
        ticks: { 
          color: '#64748b',
          font: { size: 10 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8
        }
      },
      y: {
        grid: { 
          color: 'rgba(71, 85, 105, 0.2)',
          drawBorder: false
        },
        border: {
          display: false
        },
        ticks: { 
          color: '#64748b',
          font: { size: 11 },
          padding: 8,
          callback: function(value: any) {
            return '$' + value.toFixed(2);
          }
        }
      }
    },
    interaction: { 
      mode: 'index' as const, 
      intersect: false 
    }
  };

  // --- RENDER ---
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
          <div>
            <h2 className="text-2xl font-bold text-white">{item.name}</h2>
            <div 
              className="text-sm mt-1" 
              style={{ color: item.rarity_color || '#888' }}
            >
              {item.rarity || 'Unknown'}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* LEFT COLUMN: IMAGE */}
            <div className="flex flex-col gap-6">
              
              {/* 3D Preview Box */}
              <div className="aspect-[4/3] bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl flex items-center justify-center p-8 relative border border-slate-800">
                {imageLoading ? (
                  <div className="text-slate-500 flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-sm">Loading image...</span>
                  </div>
                ) : (
                  <img 
                    src={screenshotUrl || iconUrl} 
                    alt={item.name}
                    className="max-w-full max-h-full object-contain drop-shadow-2xl"
                  />
                )}
                
                <div className="absolute top-4 right-4 text-[10px] text-slate-600 bg-black/40 px-2 py-1 rounded">
                  {is3D ? "3D Render" : "2D Icon"}
                </div>

                <div className="absolute bottom-4 right-4 text-[9px] text-slate-700">
                  Powered by SteamWebAPI
                </div>
              </div>

              {/* Price Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <p className="text-xs uppercase font-bold text-slate-500 mb-2">Steam Price</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {item.pricelatest ? `$${item.pricelatest}` : "N/A"}
                  </p>
                </div>
                
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <p className="text-xs uppercase font-bold text-slate-500 mb-2">Real Cash</p>
                  <p className="text-2xl font-bold text-green-400">
                    {item.pricereal ? `$${item.pricereal}` : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: STATS */}
            <div className="flex flex-col gap-6">
              
              {/* Float Data Box */}
              {inspectLink ? (
                floatData ? (
                  <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500 uppercase mb-1">Float Value</p>
                        <p className="text-xl font-mono text-yellow-400 font-bold">
                          {floatData.floatvalue ? floatData.floatvalue.toFixed(14) : "N/A"}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-slate-500 uppercase mb-1">Paint Seed</p>
                        <p className="text-lg font-mono text-white">
                          {floatData.paintseed || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 uppercase mb-1">Paint Index</p>
                        <p className="text-lg font-mono text-white">
                          {floatData.paintindex || "N/A"}
                        </p>
                      </div>

                      {floatData.phase && (
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500 uppercase mb-1">Phase</p>
                          <p className="text-lg font-bold text-purple-400">{floatData.phase}</p>
                        </div>
                      )}

                      {floatData.stickers && floatData.stickers.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500 uppercase mb-2 flex items-center gap-1">
                            <Tag size={12} />
                            Stickers ({floatData.stickers.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {floatData.stickers.map((sticker: any, i: number) => (
                              <div 
                                key={i}
                                className="bg-black/40 px-3 py-2 rounded-md text-xs border border-slate-700 flex items-center gap-2"
                              >
                                {sticker.image && (
                                  <img 
                                    src={sticker.image} 
                                    alt={sticker.name}
                                    className="w-6 h-6 object-contain"
                                  />
                                )}
                                <span className="text-slate-300">
                                  {sticker.name || `Slot ${sticker.slot}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700 text-center">
                    <p className="text-sm text-slate-400">Float data unavailable</p>
                  </div>
                )
              ) : (
                <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700 text-center">
                  <p className="text-sm text-slate-400">Item is not inspectable (No Float)</p>
                </div>
              )}

              {/* Price Chart */}
              <div className="flex-1 bg-slate-800/30 rounded-xl border border-slate-700/50 min-h-[300px] flex flex-col overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/30">
                  <div className="flex items-center gap-2 text-slate-300">
                    <TrendingUp size={18} className="text-green-400" />
                    <span className="text-sm font-semibold">Price History</span>
                  </div>
                  
                  {/* Time Period Buttons */}
                  <div className="flex gap-1.5 bg-slate-950/50 rounded-lg p-1 border border-slate-700/30">
                    <button
                      onClick={() => setTimePeriod('24h')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        timePeriod === '24h' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      24h
                    </button>
                    <button
                      onClick={() => setTimePeriod('7d')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        timePeriod === '7d' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setTimePeriod('30d')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        timePeriod === '30d' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      Month
                    </button>
                    <button
                      onClick={() => setTimePeriod('90d')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        timePeriod === '90d' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      3 Months
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-5 min-h-[220px]">
                  {historyLoading ? (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading price history...
                      </span>
                    </div>
                  ) : chartData ? (
                    <Line data={chartData} options={chartOptions} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <TrendingUp className="w-12 h-12 mb-3 opacity-30" />
                      <p className="text-sm">No price history available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Inspect In Game Button */}
              {inspectLink && (
                <a 
                  href={inspectLink}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Gamepad2 className="w-5 h-5" />
                  🔍 INSPECT IN GAME
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}