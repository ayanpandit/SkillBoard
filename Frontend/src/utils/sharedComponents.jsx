import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Reusable StatCard component for displaying stats with icon
 * Used across all profile analyzers
 */
export const StatCard = ({ title, value, icon, color = "text-purple-400" }) => (
  <div className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-lg shadow-md flex items-center border border-slate-700/50 hover:border-slate-600/70 transition-all duration-300">
    {React.createElement(icon, { className: `w-8 h-8 mr-3 ${color}` })}
    <div>
      <p className="text-sm text-slate-400">{title}</p>
      <p className="text-xl font-semibold text-slate-100">
        {value === undefined || value === null || value === '' ? 'N/A' : String(value)}
      </p>
    </div>
  </div>
);

/**
 * Reusable collapsible section component
 * Used across all profile analyzers
 */
export const Section = ({ title, children, icon, defaultOpen = false, accentColor = "text-purple-400" }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="mb-6 bg-slate-800/40 backdrop-blur-sm rounded-lg shadow-md border border-slate-700/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center p-4 text-left text-slate-100 hover:bg-slate-700/70 rounded-t-lg transition-colors focus:outline-none focus:ring-2 focus:ring-${accentColor.replace('text-', '')}`}
      >
        <div className="flex items-center">
          {React.createElement(icon, { className: `w-5 h-5 mr-2 ${accentColor}` })}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && <div className="p-4 border-t border-slate-700">{children}</div>}
    </div>
  );
};

/**
 * Helper function to safely get nested values from objects
 * Prevents crashes when accessing deeply nested properties
 */
export const getNestedValue = (obj, path, defaultValue = 'N/A') => {
  const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
  return (value === undefined || value === null || value === '') ? defaultValue : value;
};

/**
 * Sortable table header component
 * Used for sortable columns in results tables
 */
export const SortableHeader = ({ columnKey, title, currentSortConfig, onRequestSort, accentColor = "purple" }) => (
  <th 
    scope="col" 
    className="px-5 py-3 cursor-pointer hover:bg-slate-600/50 transition-colors select-none" 
    onClick={() => onRequestSort(columnKey)}
  >
    <div className="flex items-center justify-between">
      <span>{title}</span>
      <div className="flex flex-col ml-1">
        <ChevronUp 
          size={12} 
          className={currentSortConfig.key === columnKey && currentSortConfig.direction === 'ascending' 
            ? `text-${accentColor}-400` 
            : 'text-slate-600'
          } 
        />
        <ChevronDown 
          size={12} 
          className={currentSortConfig.key === columnKey && currentSortConfig.direction === 'descending' 
            ? `text-${accentColor}-400` 
            : 'text-slate-600'
          } 
        />
      </div>
    </div>
  </th>
);
