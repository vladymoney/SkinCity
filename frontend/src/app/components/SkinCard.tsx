import React from 'react';

interface Skin {
  assetid: string;
  name: string;
  image: string;
  rarity_color: string;
}

interface SkinCardProps {
  skin: Skin;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  actionColor?: string;
}

const SkinCard: React.FC<SkinCardProps> = ({ skin, actionLabel, onAction, disabled, actionColor = 'bg-blue-600' }) => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex flex-col justify-between h-full group transition-all hover:border-blue-500">
      <div className="flex-1 flex items-center justify-center mb-3">
        <img 
          src={`https://community.cloudflare.steamstatic.com/economy/image/${skin.image}`} 
          alt={skin.name} 
          className="max-h-24 object-contain transition-transform group-hover:scale-110"
        />
      </div>
      <div>
        <p 
          className="text-xs font-bold truncate" 
          style={{ color: skin.rarity_color }}
        >
          {skin.name}
        </p>
        <button 
          onClick={onAction}
          disabled={disabled}
          className={`w-full mt-2 px-2 py-1 text-xs font-bold text-white rounded transition-colors ${actionColor} hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed`}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
};

export default SkinCard;