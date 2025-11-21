"use client";

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Tag } from 'lucide-react';
import SkinCard from './SkinCard';

interface InventoryItem {
  assetid: string;
  name: string;
  image: string;
  rarity_color: string;
}

interface ListedItem {
  id: string;
  assetid: string;
}

interface InventoryModalProps {
  onClose: () => void;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ onClose }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [listedItems, setListedItems] = useState<ListedItem[]>([]); 
  const [loading, setLoading] = useState(true);
  const [actionItem, setActionItem] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, listedRes] = await Promise.all([
        fetch('http://localhost:8080/api/inventory/cs2', { credentials: 'include' }),
        fetch('http://localhost:8080/api/showcase/mine', { credentials: 'include' }) 
      ]);
      
      if (invRes.ok) setInventory(await invRes.json());
      if (listedRes.ok) setListedItems(await listedRes.json());

    } catch (error) {
      console.error("Failed to load inventory data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleListAction = async (skin: InventoryItem, isListed: boolean) => {
    setActionItem(skin.assetid);
    try {
      if (isListed) { 
        const response = await fetch(`http://localhost:8080/api/showcase/${skin.assetid}`, { method: 'DELETE', credentials: 'include' });
        if (response.ok) setListedItems(prev => prev.filter(i => i.assetid !== skin.assetid));
      } else { 
        const response = await fetch('http://localhost:8080/api/showcase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ assetid: skin.assetid, name: skin.name, image_url: skin.image, rarity_color: skin.rarity_color }),
        });
        if (response.ok) {
          const newListedItem = await response.json();
          setListedItems(prev => [...prev, newListedItem]);
        }
      }
    } catch (error) {
      alert("Action failed.");
    } finally {
      setActionItem(null);
    }
  };

  const listedAssetIds = new Set(listedItems.map(item => item.assetid));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">List Items for Trade</h2>
          <div className="flex items-center gap-4">
            <button onClick={loadData} className="p-2 text-gray-400 hover:text-white"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
          </div>
        </div>

        {}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-800">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">Loading your inventory...</div>
          ) : inventory.length === 0 ? (
            <div className="text-center text-gray-500">Your inventory is empty.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {inventory.map(skin => {
                const isListed = listedAssetIds.has(skin.assetid);
                return (
                  <SkinCard 
                    key={skin.assetid}
                    skin={skin} 
                    // Corrected Button Labels
                    actionLabel={actionItem === skin.assetid ? "..." : (isListed ? "Unlist Item" : "List for Trade")}
                    onAction={() => handleListAction(skin, isListed)}
                    disabled={!!actionItem}
                    actionColor={isListed ? 'bg-red-600' : 'bg-green-600'}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;