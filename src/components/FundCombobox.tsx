import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { Fund } from '../types';
import { trackFundSelect, trackFundSearch } from '../utils/analytics';

interface FundComboboxProps {
  selectedFund: Fund | null;
  allFunds: Fund[];
  excludedFundIds?: string[];
  onSelect: (fund: Fund) => void;
  onClear: () => void;
  rowLabel?: string;
  isRemovable?: boolean;
  color?: string;
  dropdownAlign?: 'left' | 'right';
  placeholder?: string;
}

export const FundCombobox: React.FC<FundComboboxProps> = ({
  selectedFund,
  allFunds = [],
  excludedFundIds = [],
  onSelect,
  onClear,
  rowLabel = 'Fund',
  dropdownAlign = 'left',
  placeholder = 'Select fund...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      // Auto-focus search input inside dropdown
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter funds from backend:
  // 1. Exclude funds selected in ANY of the other slots so duplicate selection is impossible
  // 2. If searchQuery is empty, show ALL available funds immediately (no need to clear first!)
  const availableFunds = allFunds.filter((fund) => {
    if (excludedFundIds.includes(fund.id)) {
      return false;
    }
    return true;
  });

  const filteredFunds = availableFunds.filter((fund) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      fund.name.toLowerCase().includes(q) ||
      fund.shortName.toLowerCase().includes(q) ||
      fund.amc.toLowerCase().includes(q) ||
      fund.category.toLowerCase().includes(q)
    );
  });

  const handleSelect = (fund: Fund) => {
    trackFundSelect(fund.name, fund.category, 0);
    onSelect(fund);
    setIsOpen(false);
    setSearchQuery('');
  };

  const toggleDropdown = () => {
    setSearchQuery('');
    setIsOpen((prev) => !prev);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Clickable Header Display matching CSS selector 1 and child SVG matching CSS selector 2 */}
      <div
        id={`fund-name-display-${rowLabel.toLowerCase().replace(/\s+/g, '-')}`}
        onClick={toggleDropdown}
        className={`cursor-pointer py-1.5 px-2 rounded-lg transition-all flex items-center justify-between gap-1.5 group select-none ${
          selectedFund
            ? 'hover:bg-neutral-200/70'
            : 'border border-dashed border-neutral-300 hover:border-neutral-400 bg-white/80 hover:bg-white text-neutral-500'
        }`}
        title={selectedFund ? 'Click to browse all schemes or swap fund' : 'Click to select a fund'}
      >
        <div className="text-xs font-semibold text-neutral-900 leading-snug break-words whitespace-normal flex-1">
          {selectedFund ? selectedFund.name : placeholder}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-900 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-neutral-900' : 'group-hover:translate-y-0.5'
          }`}
        />
      </div>

      {/* Dropdown Menu displaying ALL funds immediately without needing to clear */}
      {isOpen && (
        <div
          id={`fund-dropdown-menu-${rowLabel.toLowerCase().replace(/\s+/g, '-')}`}
          className={`absolute ${
            dropdownAlign === 'right' ? 'right-0' : 'left-0'
          } top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-neutral-200 p-2 min-w-[280px] max-w-[340px] w-full max-h-84 flex flex-col`}
        >
          {/* Search Bar inside Dropdown */}
          <div className="relative mb-2 shrink-0">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim().length >= 2) {
                  trackFundSearch(e.target.value, filteredFunds.length);
                }
              }}
              placeholder="Filter by scheme, AMC, or ETF..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-400 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
                title="Clear filter"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Subheader: Available schemes count + clear button */}
          <div className="px-1 pb-1.5 text-[10px] uppercase tracking-wider font-semibold text-neutral-400 flex items-center justify-between shrink-0 border-b border-neutral-100">
            <span>Available Schemes ({filteredFunds.length})</span>
            {selectedFund && (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setIsOpen(false);
                }}
                className="text-red-600 hover:text-red-700 hover:underline normal-case tracking-normal text-[11px] font-medium cursor-pointer"
              >
                Clear scheme
              </button>
            )}
          </div>

          {/* List of Funds (all funds shown immediately) */}
          <div className="overflow-y-auto max-h-56 divide-y divide-neutral-100 pr-0.5 mt-1">
            {filteredFunds.map((fund) => {
              const isSelected = selectedFund?.id === fund.id;
              return (
                <button
                  key={fund.id}
                  id={`select-fund-${fund.id}`}
                  type="button"
                  onClick={() => handleSelect(fund)}
                  className={`w-full text-left px-2.5 py-2 text-xs rounded-lg transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-100 font-semibold text-neutral-900'
                      : 'hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium text-neutral-900" title={fund.name}>
                      {fund.name}
                    </div>
                    <div className="text-[10px] text-neutral-500 truncate flex items-center gap-1.5 mt-0.5">
                      <span className="font-semibold text-neutral-700">{fund.amc}</span>
                      <span>•</span>
                      <span>{fund.category}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                </button>
              );
            })}

            {filteredFunds.length === 0 && (
              <div className="py-4 text-center text-xs text-neutral-400">
                {allFunds.length === 0
                  ? 'No funds found in backend database.'
                  : availableFunds.length === 0
                  ? 'All available funds are already selected in other slots.'
                  : 'No matching funds or ETFs found.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
