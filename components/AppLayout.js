'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

export default function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Close sidebar on route change
  useEffect(() => {
    closeSidebar();
  }, [pathname]);

  // Prevent scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  return (
    <div className="flex min-h-screen relative">
      {/* Mobile Navbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-slate-900 tracking-tight">Epic Agency</span>
        </div>
        <button 
          onClick={toggleSidebar}
          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      <div 
        className={`lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 md:p-8 lg:p-12 overflow-y-auto max-h-screen mt-16 lg:mt-0">
        {children}
      </main>
    </div>
  );
}
