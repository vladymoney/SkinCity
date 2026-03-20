import React from 'react';
import Link from 'next/link';
import { TrendingUp, Shield, Github } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-900/60 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-wider text-white">
                SKIN<span className="text-blue-500">CITY</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Bulgaria's #1 CS2 skin trading platform. Secure P2P trades with 7-day escrow protection.
            </p>
            <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2 w-fit">
              <Shield className="w-3.5 h-3.5 shrink-0" />
              All trades escrow protected
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Marketplace</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Browse Listings', href: '/traders' },
                { label: 'Recently Added', href: '/traders?sort=listed_at_desc' },
                { label: 'Lowest Price', href: '/traders?sort=price_asc' },
                { label: 'Best Float', href: '/traders?sort=float_asc' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Account</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'My Profile', href: '/profile' },
                { label: 'My Inventory', href: '/profile' },
                { label: 'My Listings', href: '/profile' },
                { label: 'Trade History', href: '/profile' },
              ].map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Info</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'How It Works',      href: '/#how-it-works' },
                { label: 'Fees & Escrow',     href: '/#how-it-works' },
                { label: 'Steam Trade Guide', href: 'https://help.steampowered.com/en/faqs/view/01B8-9699-6E68-BC22', external: true },
                { label: 'Support',           href: 'mailto:support@skincity.bg', external: true },
              ].map(link => (
                <li key={link.label}>
                  {'external' in link && link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © {year} SkinCity. Not affiliated with Valve Corporation or Steam.
          </p>
          <p className="text-xs text-gray-600">
            CS2 item data provided by SteamWebAPI. All trademarks belong to their respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
