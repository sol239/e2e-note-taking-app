"use client";

import { usePathname, useRouter } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import SettingsContent from './SettingsContent';
import { useMainView } from '../contexts/MainViewContext';
import { useEffect } from 'react';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
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

  useEffect(() => {
    // if user is trying to access notebooks without a token, redirect to login
    // protects both /notebooks and /notebooks/[id]
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token && pathname && pathname.startsWith('/notebooks')) {
      router.push('/login');
    }
  }, [pathname, router]);

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
