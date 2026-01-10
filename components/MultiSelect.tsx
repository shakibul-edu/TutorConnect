
import React, { useState, useRef, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface Option {
  id: number;
  name: string;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selectedIds, onChange, placeholder = "Search..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter(opt => selectedIds.includes(opt.id));
  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    !selectedIds.includes(opt.id)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: number) => {
    onChange([...selectedIds, id]);
    setSearchTerm("");
  };

  const handleRemove = (id: number) => {
    onChange(selectedIds.filter(prevId => prevId !== id));
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      
      {/* Selected Tags Area */}
      <div 
        className="min-h-[42px] w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 flex flex-wrap gap-2 cursor-text"
        onClick={() => setIsOpen(true)}
      >
        {selectedOptions.map(opt => (
          <span key={opt.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
            {opt.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(opt.id);
              }}
              className="ml-1.5 inline-flex items-center justify-center text-indigo-600 hover:text-indigo-900 focus:outline-none"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input 
          type="text" 
          className="flex-1 min-w-[100px] outline-none text-sm bg-transparent"
          placeholder={selectedOptions.length === 0 ? placeholder : ""}
          value={searchTerm}
          onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto sm:text-sm">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt.id}
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 text-gray-900"
                onClick={() => handleSelect(opt.id)}
              >
                <span className="block truncate font-medium">{opt.name}</span>
              </div>
            ))
          ) : (
            <div className="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-500">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
