import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalSettingsProvider } from "../contexts/GlobalSettingsContext";
import { MainViewProvider } from "../contexts/MainViewContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | E2E Note Taking App',
    default: 'E2E Note Taking App',
  },
  description: "Secure, End-to-End Encrypted Note Taking Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GlobalSettingsProvider>
          <MainViewProvider>
            {children}
          </MainViewProvider>
        </GlobalSettingsProvider>
      </body>
    </html>
  );
}
