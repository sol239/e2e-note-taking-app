"use client";

import Sidebar from '../../components/Sidebar';
import SettingsContent from '../../components/SettingsContent';
import { useMainView } from '../../contexts/MainViewContext';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function NotebooksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { view, setView } = useMainView();
  const pathname = usePathname();

  useEffect(() => {
    setView(null);
  }, [pathname, setView]);
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        {view === 'settings' ? <SettingsContent /> : children}
      </div>
    </div>
  );
}
