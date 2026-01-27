"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { GlobalSettingsProvider } from "../contexts/GlobalSettingsContext";
import { MainViewProvider } from "../contexts/MainViewContext";
import { Toaster } from "react-hot-toast";
import GlobalUnlockModal from "./layout";

// Extract GlobalUnlockModal from layout.tsx
function GlobalUnlockModalWrapper() {
  // Import GlobalUnlockModal from layout.tsx
  // This is a workaround to avoid circular import; will update layout.tsx accordingly
  // The actual GlobalUnlockModal code will be moved here
  const { hasMasterKey, checkMasterKey } = require("../contexts/MainViewContext").useMainView();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  const UnlockModal = require("../components/UnlockModal").default;
  return (
    <UnlockModal
      isOpen={!hasMasterKey}
      onClose={() => {}}
      onSuccess={checkMasterKey}
      showCancel={false}
    />
  );
}

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNotebookPage = pathname?.startsWith('/notebooks');

  return (
    <GlobalSettingsProvider>
      <MainViewProvider>
        {children}
        {isNotebookPage && <GlobalUnlockModalWrapper />}
        <Toaster position="top-right" />
      </MainViewProvider>
    </GlobalSettingsProvider>
  );
}