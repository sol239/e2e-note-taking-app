"use client";

import { BookOpen } from 'lucide-react';

export default function Header() {
  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-blue-600" />
        <span className="text-lg font-semibold text-gray-900">E2E Notes</span>
      </div>
    </div>
  );
}