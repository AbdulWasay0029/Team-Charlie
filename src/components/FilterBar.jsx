import React from 'react';
import { CATEGORIES, STATUS_OPTIONS } from '../mockData';
import { RefreshCw } from 'lucide-react';

export default function FilterBar({
  filters,
  setFilters,
  sortBy,
  setSortBy,
  onRefresh,
  isPolling
}) {
  return (
    <div className="absolute top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-4xl z-[1000] transition-all duration-300">
      <div className="bg-raised-lacquer/90 backdrop-blur-md border border-white/10 rounded-sm shadow-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Brand/Logo Section (Impeccable theme) */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Kinpaku solid tile mark glyph */}
          <div className="bg-kinpaku-gold w-9 h-9 rounded-none flex items-center justify-center text-lacquer-deep shadow-md font-display font-black text-xl select-none">
            BP
          </div>
          <div className="text-left">
            <h1 className="text-champagne font-display font-light text-2xl leading-none tracking-wide flex items-center gap-1.5">
              BHARAT PATROL
              <span className="bg-verdigris-patina/10 text-verdigris-patina text-[10px] px-1.5 py-0.5 rounded-none border border-verdigris-patina/30 font-mono tracking-widest font-extrabold uppercase animate-pulse">
                Live
              </span>
            </h1>
            <p className="text-text-muted text-[10px] font-mono tracking-widest uppercase mt-0.5">
              GHMC Citizen Accountability
            </p>
          </div>
        </div>

        {/* Filter and Sort Inputs */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end font-body">
          {/* Category Filter */}
          <div className="relative flex-1 min-w-[130px] md:flex-initial">
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full bg-graphite hover:bg-graphite-2 border border-white/15 text-champagne rounded-sm py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-kinpaku-gold focus:border-transparent transition cursor-pointer appearance-none"
            >
              <option value="all">📁 All Categories</option>
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative flex-1 min-w-[130px] md:flex-initial">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full bg-graphite hover:bg-graphite-2 border border-white/15 text-champagne rounded-sm py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-kinpaku-gold focus:border-transparent transition cursor-pointer appearance-none"
            >
              <option value="all">🏷️ All Statuses</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selection */}
          <div className="relative flex-1 min-w-[125px] md:flex-initial">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-graphite hover:bg-graphite-2 border border-white/15 text-champagne rounded-sm py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-kinpaku-gold focus:border-transparent transition cursor-pointer appearance-none"
            >
              <option value="priority">🔥 Sort: Priority</option>
              <option value="newest">🕒 Sort: Newest</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            title="Refresh Data"
            className="bg-graphite hover:bg-graphite-2 border border-white/15 text-text-muted hover:text-champagne p-2.5 rounded-sm transition flex items-center justify-center relative cursor-pointer"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${isPolling ? 'animate-spin text-kinpaku-gold' : ''}`} />
            {isPolling && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kinpaku-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-kinpaku-gold"></span>
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
