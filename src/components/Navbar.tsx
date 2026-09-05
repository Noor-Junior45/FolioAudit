import React, { useEffect, useState } from 'react';
import { checkNeonStatus } from '../utils/api';
import { Database, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [neonStatus, setNeonStatus] = useState<{ configured: boolean; connected: boolean; database?: string }>({
    configured: false,
    connected: false,
  });

  useEffect(() => {
    checkNeonStatus().then(setNeonStatus);
  }, []);

  return (
    <header 
      id="top-navbar" 
      className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200"
    >
      <div className="max-w-7xl mx-auto px-6 py-3 md:py-3.5 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 group select-none">
          <img
            src="https://i.imgur.com/rzIOCaN.jpeg"
            alt="FolioAudit Logo"
            className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover shadow-2xs border border-neutral-200/80 group-hover:scale-105 transition-transform"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            <span className="text-green-600">Folio</span>
            <span className="text-red-600">Audit</span>
          </h1>
        </a>

        {/* Live Data & Backend Status Badge */}
        <div className="flex items-center gap-2">
          {neonStatus.connected ? (
            <div 
              id="neon-status-connected" 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium"
              title={`Connected to Neon Postgres (${neonStatus.database || 'main'})`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Neon SQL Live</span>
            </div>
          ) : (
            <div 
              id="neon-status-statutory" 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 text-xs font-medium"
              title="Sourced from statutory AMC month-end portfolio disclosures"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">SEBI Statutory Disclosures</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
