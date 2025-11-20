"use client";

import React from 'react';
import UserSettings from '../../components/UserSettings';

export default function UserSettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-12 text-center">User Settings</h1>
        <UserSettings />
      </div>
    </div>
  );
}