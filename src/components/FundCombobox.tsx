import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Fund } from '../types';
import { MOCK_FUNDS } from '../data/mockFunds';

interface FundComboboxProps {
  selectedFund: Fund | null;
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
  onSelect,
  onClear,
  rowLabel = 'Fund',
  dropdownAlign = 'left',
  placeholder = 'Search fund...'
}) => {
  const [inputValue, setInputValue] = useState(selectedFund ? selectedFund.name : '');
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep input text in sync when selectedFund changes
  useEffect(() => {
    setInputValue(selectedFund ? selectedFund.name : '');
  }, [selectedFund]);

  // Focus and select input text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close dropdown and exit edit mode on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditing(false);
        setInputValue(selectedFund ? selectedFund.name : '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedFund]);

  const filteredFunds = MOCK_FUNDS.filter((fund) => {
    const q = inputValue.toLowerCase().trim();
    if (!q) return true;
    return (
      fund.name.toLowerCase().includes(q) ||
      fund.shortName.toLowerCase().includes(q) ||
      fund.amc.toLowerCase().includes(q) ||
      fund.category.toLowerCase().includes(q)
    );
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
    if (val.trim() === '' && selectedFund) {
      onClear();
    }
  };

  const handleSelect = (fund: Fund) => {
    onSelect(fund);
    setInputValue(fund.name);
    setIsEditing(false);
    setIsOpen(false);
  };

  const startEditing = () => {
    setIsEditing(true);
    setIsOpen(true);
  };

  const showSearchInput = !selectedFund || isEditing;

  return (
    <div ref={containerRef} className="relative w-full">
      {!showSearchInput && selectedFund ? (
        /* When fund is chosen: Clean text with arrow, no border around fund */
        <div
          id={`fund-name-display-${rowLabel.toLowerCase().replace(/\s+/g, '-')}`}
          onClick={startEditing}
          className="cursor-pointer py-1 px-1 rounded-md hover:bg-neutral-200/50 transition-colors flex items-center justify-between gap-1.5 group"
          title="Click to change scheme"
        >
          <div className="text-xs font-semibold text-neutral-900 leading-snug break-words whitespace-normal flex-1">
            {selectedFund.name}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-900 shrink-0 transition-transform group-hover:translate-y-0.5" />
        </div>
      ) : (
        /* Search bar input mode: Clean search bar when empty/editing, no arrow */
        <div className="w-full">
          <input
            ref={inputRef}
            id={`search-fund-input-${rowLabel.toLowerCase().replace(/\s+/g, '-')}`}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
          />

          {isOpen && (
            <div
              className={`absolute ${
                dropdownAlign === 'right' ? 'right-0' : 'left-0'
              } top-full mt-1 z-50 bg-white rounded-lg shadow-lg border border-neutral-200 p-1 min-w-[260px] max-w-[320px] max-h-60 overflow-y-auto`}
            >
              {filteredFunds.map((fund) => (
                <button
                  key={fund.id}
                  id={`select-fund-${fund.id}`}
                  type="button"
                  onClick={() => handleSelect(fund)}
                  className="w-full text-left px-3 py-2 text-xs text-neutral-800 hover:bg-neutral-100 rounded transition-colors block truncate cursor-pointer"
                  title={fund.name}
                >
                  {fund.name}
                </button>
              ))}
              {filteredFunds.length === 0 && (
                <div className="px-3 py-2 text-xs text-neutral-400">
                  No matching funds found
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

