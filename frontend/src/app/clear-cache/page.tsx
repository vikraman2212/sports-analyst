'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ClearCachePage() {
  const [cleared, setCleared] = useState(false);

  const clearAll = () => {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    setCleared(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Clear Cache & Storage</h1>
        
        {!cleared ? (
          <div className="space-y-4">
            <p className="text-gray-300">
              This will clear all saved calibration profiles and settings.
            </p>
            <button
              onClick={clearAll}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded font-semibold transition-colors"
            >
              Clear All Storage
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-900/30 border border-green-500/50 rounded">
              <p className="text-green-200">✅ Storage cleared successfully!</p>
            </div>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition-colors"
            >
              Go to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
