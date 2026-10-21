import React from 'react';
import { 
  Wrench, 
  Film, 
  Gamepad2, 
  CheckSquare, 
  Cpu, 
  FolderGit2, 
  LayoutGrid, 
  Search, 
  SlidersHorizontal,
  X
} from 'lucide-react';
import { AppCategory } from '../types/app';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSort: string;
  onSortChange: (sort: string) => void;
  totalResults: number;
}

const CATEGORIES: { name: string; label: string; icon: React.FC<{ className?: string }> }[] = [
  { name: 'All', label: 'All Apps', icon: LayoutGrid },
  { name: 'Tools', label: 'Tools', icon: Wrench },
  { name: 'Entertainment', label: 'Entertainment', icon: Film },
  { name: 'Games', label: 'Games', icon: Gamepad2 },
  { name: 'Productivity', label: 'Productivity', icon: CheckSquare },
  { name: 'Utilities', label: 'Utilities', icon: Cpu },
  { name: 'Other', label: 'Other', icon: FolderGit2 },
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  selectedSort,
  onSortChange,
  totalResults,
}) => {
  return (
    <div id="categories" className="space-y-4">
      {/* Category Pills (horizontally scrollable on mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/20'
                  : 'bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-white/5 hover:border-white/10'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar + Sort Dropdown Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search apps by title, keyword, package name..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm text-slate-100 placeholder-slate-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort & Result Counter */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
            Showing <strong className="text-slate-200">{totalResults}</strong> app{totalResults === 1 ? '' : 's'}
          </span>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:inline" />
            <select
              value={selectedSort}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="latest">Latest Releases</option>
              <option value="downloads">Most Downloaded</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
