import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  idPrefix?: string;
}

export const FundCombobox: React.FC<FundComboboxProps> = ({
  selectedFund,
  allFunds = [],
  excludedFundIds = [],
  onSelect,
  onClear,
  rowLabel = 'Fund',
  color,
  dropdownAlign = 'left',
  placeholder = 'Select fund...',
  idPrefix = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Position calculation so the dropdown floats in the front layer without being clipped by table overflow
  const updateDropdownPos = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const menuWidth = Math.min(380, window.innerWidth - 24);

    let left = dropdownAlign === 'right' ? rect.right - menuWidth : rect.left;

    if (left < 12) left = 12;
    if (left + menuWidth > window.innerWidth - 12) {
      left = window.innerWidth - menuWidth - 12;
    }

    setDropdownPos({
      top: rect.bottom + 6,
      left,
      width: menuWidth,
    });
  };

  // Focus search input and calculate initial coordinates when dropdown opens
  useEffect(() => {
    if (isOpen) {
      updateDropdownPos();
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Keep dropdown aligned if user scrolls (vertically or horizontally) or resizes window
  useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => {
      updateDropdownPos();
    };

    window.addEventListener('scroll', handleUpdate, { passive: true, capture: true });
    window.addEventListener('resize', handleUpdate, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleUpdate, { capture: true } as any);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isOpen, dropdownAlign]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

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
    if (!isOpen) {
      updateDropdownPos();
    }
    setIsOpen((prev) => !prev);
  };

  const prefixStr = idPrefix ? `${idPrefix}-` : '';

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Clickable Header Display: Text only with dropdown chevron, no box and no color dot */}
      <div
        id={`${prefixStr}fund-name-display-${rowLabel.toLowerCase().replace(/\s+/g, '-')}`}
        onClick={toggleDropdown}
        className="cursor-pointer py-1.5 px-2 rounded-md transition-colors flex items-center justify-between gap-1.5 group select-none hover:bg-neutral-200/50"
        title={selectedFund ? 'Click to browse all schemes or swap fund' : `Click to choose ${rowLabel}`}
      >
        <div
          className={`text-xs leading-snug break-words whitespace-normal flex-1 ${
            selectedFund
              ? 'font-semibold text-neutral-900 group-hover:text-neutral-950'
              : 'font-medium text-neutral-500 group-hover:text-neutral-800'
          }`}
        >
          {selectedFund ? selectedFund.name : placeholder}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-900 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-neutral-900' : 'group-hover:translate-y-0.5'
          }`}
        />
      </div>

      {/* Dropdown Menu: Rendered in Portal on front-most layer with expanded length */}
      {isOpen && dropdownPos && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            id={`${prefixStr}fund-dropdown-menu-${rowLabel.toLowerCase().replace(/\s+/g, '-')}`}
            style={{
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              width: `${dropdownPos.width}px`,
            }}
            className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-neutral-300/90 p-3 max-h-[min(540px,78vh)] flex flex-col animate-in fade-in zoom-in-95 duration-100"
          >
            {/* Search Bar inside Dropdown */}
            <div className="relative mb-2.5 shrink-0">
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
                className="w-full pl-8 pr-7 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-400 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
                  title="Clear filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Subheader: Available schemes count + clear button */}
            <div className="px-1 pb-2 text-[10px] uppercase tracking-wider font-semibold text-neutral-400 flex items-center justify-between shrink-0 border-b border-neutral-100">
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

            {/* List of Funds: Expanded height/length for easy browsing */}
            <div className="overflow-y-auto max-h-[min(420px,62vh)] divide-y divide-neutral-100 pr-1 mt-1.5 space-y-0.5">
              {filteredFunds.map((fund) => {
                const isSelected = selectedFund?.id === fund.id;
                return (
                  <button
                    key={fund.id}
                    id={`${prefixStr}select-fund-${fund.id}`}
                    type="button"
                    onClick={() => handleSelect(fund)}
                    className={`w-full text-left px-3 py-2.5 text-xs rounded-lg transition-colors flex items-center justify-between gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-100 font-semibold text-neutral-900'
                        : 'hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium text-neutral-900 leading-snug" title={fund.name}>
                        {fund.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 truncate flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-neutral-700">{fund.amc}</span>
                        <span>•</span>
                        <span>{fund.category}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })}

              {filteredFunds.length === 0 && (
                <div className="py-6 text-center text-xs text-neutral-400">
                  {allFunds.length === 0
                    ? 'No funds found in backend database.'
                    : availableFunds.length === 0
                    ? 'All available funds are already selected in other slots.'
                    : 'No matching funds or ETFs found.'}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
