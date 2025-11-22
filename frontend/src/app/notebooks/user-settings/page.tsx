"use client";

import React from 'react';
import UserSettings from '../../../components/UserSettings';

export default function NotebooksUserSettingsPage() {
  return (
    <div className="max-w-5xl mx-auto px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-12 text-center">User Settings</h1>
      <UserSettings />
    </div>
  );
}
