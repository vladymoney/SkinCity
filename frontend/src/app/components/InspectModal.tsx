"use client";

import React, { useEffect, useState } from 'react';
import { X, Loader2, Gamepad2, Tag, Info, BarChart3, Crosshair } from 'lucide-react';
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
  TimeScale,
  Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, Filler);

interface Props {
  item: any; 
  onClose: () => void;
}

const STEAM_WEB_API_KEY = "UTJS2Q98AP3BTYNU";

export default function InspectModal({ item, onClose }: Props) {
  if (!item) return null;

  const [loading, setLoading] = useState(true);
  
  // Data States
  const [floatData, setFloatData] = useState<any>(null);
  const [marketData, setMarketData] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [inspectLink, setInspectLink] = useState<string | null>(null);

  // --- PROXY FETCHER (Bypass Bulgaria Block) ---
  const fetchViaProxy = async (targetUrl: string) => {
    try {
      const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(targetUrl);
      const res = await fetch(proxyUrl);
      if (!res.ok) return null; 
      return await res.json();
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      
      // RESET DATA
      setFloatData(null);
      setMarketData(null);
      setChartData(null);
      
      // 1. EXTRACT LINK
      // We look in 'inspect_link' first, then inside the 'actions' array (Standard Steam format)
      let foundLink = item.inspect_link;
      if (!foundLink && item.actions && item.actions.length > 0) {
          // Find the action that is the inspect link
          const inspectAction = item.actions.find((a: any) => a.link && a.link.includes('steam://rungame/730'));
          if (inspectAction) foundLink = inspectAction.link;
      }
      
      // If we still don't have a link, we check if the user passed it as 'link'
      if (!foundLink) foundLink = item.link;

      setInspectLink(foundLink);
      setImageUrl(item.image); // Default to inventory image

      // 2. FETCH FLOAT DATA (Needs Link)
      if (foundLink) {
          console.log("Found Link, getting Float...", foundLink);
          const floatUrl = `https://www.steamwebapi.com/steam/api/float?key=${STEAM_WEB_API_KEY}&url=${encodeURIComponent(foundLink)}`;
          const floatRes = await fetchViaProxy(floatUrl);

          if (isMounted && floatRes && floatRes.iteminfo) {
              setFloatData(floatRes.iteminfo);
              // Use 3D Screenshot if available
              if(floatRes.iteminfo.screenshot_url) setImageUrl(floatRes.iteminfo.screenshot_url);
          }
      }

      // 3. FETCH MARKET DATA (Needs Name)
      if (item.name) {
          const itemUrl = `https://www.steamwebapi.com/steam/api/item?key=${STEAM_WEB_API_KEY}&market_hash_name=${encodeURIComponent(item.name)}`;
          const itemRes = await fetchViaProxy(itemUrl);

          if (isMounted && itemRes) {
              const itemObj = Array.isArray(itemRes) ? itemRes[0] : itemRes;
              
              if (itemObj && (itemObj.id || itemObj.pricelatest)) {
                  setMarketData(itemObj);
                  // If we didn't get a 3D image, check for a better 2D one here
                  if(!floatData?.screenshot_url && itemObj.image) {
                      setImageUrl(itemObj.image);
                  }

                  // Build Chart
                  if (itemObj.latest10steamsales) {
                      const sales = itemObj.latest10steamsales.slice().reverse();
                      setChartData({
                          labels: sales.map((x: any) => x[0]),
                          datasets: [{
                              label: 'Price ($)',
                              data: sales.map((x: any) => x[1]),
                              borderColor: '#4caf50',
                              backgroundColor: 'rgba(76, 175, 80, 0.2)',
                              borderWidth: 2,
                              pointRadius: 4,
                              fill: true,
                              tension: 0.3
                          }]
                      });
                  }
              }
          }
      }

      if (isMounted) setLoading(false);
    };

    loadData();
    return () => { isMounted = false; };
  }, [item]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {item.name}
            </h2>
            <div className="flex gap-4 text-sm text-slate-400 mt-1">
               <span style={{ color: item.rarity_color }}>{item.rarity || "Item"}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto flex-1 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* LEFT: VISUALS & PRICE */}
                <div className="flex flex-col gap-6">
                    {/* Image */}
                    <div className="aspect-[4/3] bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center p-8 relative border border-slate-700/50">
                        {imageUrl ? (
                            <img 
                                src={imageUrl} 
                                alt="Skin" 
                                className="max-w-full max-h-full object-contain drop-shadow-2xl"
                                onError={(e) => { e.currentTarget.src = item.image }} 
                            />
                        ) : (
                            <div className="text-slate-500 flex flex-col items-center">
                                <Loader2 className="w-8 h-8 animate-spin mb-2"/> Loading...
                            </div>
                        )}
                        {!inspectLink && (
                            <div className="absolute bottom-4 left-4 text-xs bg-black/50 px-2 py-1 rounded text-yellow-500 flex items-center gap-1">
                                <Info size={12} /> 2D View Only
                            </div>
                        )}
                    </div>

                    {/* Prices */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-center">
                            <p className="text-xs uppercase font-bold text-slate-500 mb-1">Steam Price</p>
                            <p className="text-xl font-bold text-blue-400">
                                {marketData?.pricelatest ? `$${marketData.pricelatest}` : (loading ? "..." : "N/A")}
                            </p>
                        </div>
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-center">
                            <p className="text-xs uppercase font-bold text-slate-500 mb-1">Real Cash</p>
                            <p className="text-xl font-bold text-green-400">
                                {marketData?.pricereal ? `$${marketData.pricereal}` : (loading ? "..." : "N/A")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* RIGHT: DATA & ACTIONS */}
                <div className="flex flex-col gap-6">
                    
                    {/* FLOAT & SEED */}
                    {floatData ? (
                        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                            <div className="grid grid-cols-2 gap-y-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase flex items-center gap-1"><Crosshair size={12}/> Float</p>
                                    <p className="text-lg font-mono text-yellow-400">{floatData.floatvalue.toFixed(14)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Seed</p>
                                    <p className="text-lg font-mono text-white">{floatData.paintseed}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-slate-500 uppercase flex items-center gap-1"><Tag size={12}/> Stickers</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {floatData.stickers && floatData.stickers.length > 0 ? (
                                            floatData.stickers.map((s: any, i: number) => (
                                                <span key={i} className="bg-black/40 px-3 py-1 rounded-md text-sm border border-slate-700">Slot {s.slot}</span>
                                            ))
                                        ) : (
                                            <span className="text-slate-400 text-sm">No stickers applied</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700 text-center">
                            <p className="text-sm text-slate-400">
                                {inspectLink ? (loading ? "Analyzing Float..." : "Float API Unavailable") : "Item is not inspectable (No Float)"}
                            </p>
                        </div>
                    )}

                    {/* CHART */}
                    <div className="flex-1 bg-slate-800/30 rounded-xl p-4 border border-slate-700 min-h-[200px] flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-slate-500 uppercase">Price History</p>
                            <BarChart3 className="w-4 h-4 text-slate-600"/>
                        </div>
                        <div className="flex-1 w-full h-full relative">
                            {chartData ? (
                                <Line 
                                    data={chartData} 
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
                                            y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }
                                        }
                                    }} 
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-600 text-sm">
                                    {loading ? "Loading Graph..." : "No graph data available"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* INSPECT BUTTON (Will appear if link is found) */}
                    {inspectLink && (
                        <a href={inspectLink} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
                            <Gamepad2 className="w-5 h-5" />
                            INSPECT IN GAME
                        </a>
                    )}

                </div>
            </div>
        </div>
      </div>
    </div>
  );
}