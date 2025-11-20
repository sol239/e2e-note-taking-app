"use client";

import { usePathname } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import SettingsContent from './SettingsContent';
import { useMainView } from '../contexts/MainViewContext';
import { useEffect } from 'react';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { view, setView } = useMainView();
  
  // Pages where we don't show sidebar
  const authPages = ['/login', '/register', '/'];
  const isAuthPage = authPages.includes(pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  useEffect(() => {
    // Reset the overridden view on navigation
    setView(null);
  }, [pathname, setView]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--background)]">
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {view === 'settings' ? <SettingsContent /> : children}
        </div>
      </div>
    </div>
  );
}
