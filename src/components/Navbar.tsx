import React from 'react';

export const Navbar: React.FC = () => {
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
      </div>
    </header>
  );
};
