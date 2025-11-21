"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Plus } from 'lucide-react'; 

interface User {
  username: string;
  avatar_url: string;
  balance: number;
}

interface HeaderProps {
  user: User | null;
  onTradeClick: () => void; 
}

const Header: React.FC<HeaderProps> = ({ user, onTradeClick }) => {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path ? "text-blue-500" : "text-gray-400 hover:text-white";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-gray-900/90 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-wider text-white">
            SKIN<span className="text-blue-500">CITY</span>
          </span>
        </Link>

        {}
        <div className="hidden lg:flex items-center gap-8">
          <Link href="/" className={`font-medium transition-colors ${isActive('/')}`}>Home</Link>
          <Link href="/traders" className={`font-medium transition-colors ${isActive('/traders')}`}>Traders</Link>
        </div>

        {}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {}
              <button 
                onClick={onTradeClick} 
                className="hidden md:flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-bold text-sm"
              >
                <Plus className="w-4 h-4" /> Trade Skins
              </button>

              <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-xs text-gray-400">Balance</span>
                  <span className="text-sm font-bold text-yellow-400">${(user.balance / 100).toFixed(2)}</span>
              </div>
              
              <Link href="/profile" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors">
                  <img src={user.avatar_url} alt="Avatar" className="w-6 h-6 rounded-full" />
                  <span className="text-sm font-medium text-white truncate max-w-[100px] hidden xl:block">{user.username}</span>
              </Link>
              
              <a href="http://localhost:8080/api/auth/logout" className="text-xs text-gray-500 hover:text-red-500 transition-colors hidden sm:block">
                Logout
              </a>
            </>
          ) : (
            <a href="http://localhost:8080/api/auth/steam" className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-all">
              <span>Login / Register</span>
            </a>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;