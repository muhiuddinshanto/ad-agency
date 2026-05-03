'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Megaphone, ReceiptText, TrendingUp, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'Transactions', href: '/transactions', icon: ReceiptText },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 flex flex-col w-64 h-screen bg-slate-900 text-white transition-transform duration-300 transform",
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      "lg:fixed lg:left-0 lg:top-0 lg:translate-x-0 lg:flex"
    )}>
      <div className="flex items-center justify-between px-6 py-8">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary-500 rounded-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Epic Agency</span>
        </div>
        <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                isActive ? "text-white" : "text-slate-400 group-hover:text-white"
              )} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold">
            EA
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Admin User</span>
            <span className="text-xs text-slate-500">Agency Owner</span>
          </div>
        </div>
      </div>
    </div>
  );
}
