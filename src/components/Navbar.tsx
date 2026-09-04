import React from 'react';

export const Navbar: React.FC = () => {
  return (
    <header 
      id="top-navbar" 
      className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200"
    >
      <div className="max-w-7xl mx-auto px-6 py-3.5 md:py-4 flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight select-none">
          <span className="text-green-600">Folio</span>
          <span className="text-red-600">Audit</span>
        </h1>
      </div>
    </header>
  );
};
