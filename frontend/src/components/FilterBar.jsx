import React from 'react';
import { CATEGORIES, STATUS_OPTIONS } from '../mockData';
import { RefreshCw } from 'lucide-react';

export default function FilterBar({
  filters,
  setFilters,
  sortBy,
  setSortBy,
  onRefresh,
  isPolling,
  onBackToDashboard
}) {
  return (
    <div className="absolute top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-5xl z-[1000] transition-all duration-300 font-body">
      <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl p-3 md:p-4 flex flex-col md:flex-row gap-3.5 items-center justify-between">
        
        {/* Left Section: Back Button + Brand Logo and Title */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold py-2 px-3 rounded-xl border border-slate-200 transition shadow-sm cursor-pointer flex items-center gap-1 text-xs font-mono uppercase tracking-wider shrink-0"
              title="Return to Dashboard"
            >
              <span className="text-sm">⬅</span>
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          )}
          <img src="/logo.jpeg" alt="TraceSpark" className="w-9 h-9 rounded-xl object-cover shadow-md select-none" />
          <div className="text-left">
            <h1 className="text-slate-900 font-display font-extrabold text-lg leading-none tracking-tight flex items-center gap-1.5">
              TraceSpark
              <span className="bg-teal-500/10 text-teal-600 text-[10px] px-2 py-0.5 rounded-full border border-teal-500/20 font-bold uppercase tracking-wider">
                Live
              </span>
            </h1>
            <p className="text-slate-400 text-[9px] font-mono tracking-wider uppercase mt-0.5">
              AI Civic Accountability Portal
            </p>
          </div>
        </div>

        {/* Filters and sorting selectors */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Category Dropdown */}
          <div className="relative flex-1 min-w-[125px] md:flex-initial">
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-700 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition cursor-pointer appearance-none shadow-sm"
            >
              <option value="all">📁 All Categories</option>
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="relative flex-1 min-w-[125px] md:flex-initial">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-700 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition cursor-pointer appearance-none shadow-sm"
            >
              <option value="all">🔍 All Statuses</option>
              <option value="active">⚠️ Active (Unresolved)</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.value === 'resolved' ? '✅' : '🔔'} {opt.label}
                </option>
              ))}
            </select>
          </div>


          {/* Sort Selector */}
          <div className="relative flex-1 min-w-[125px] md:flex-initial">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-700 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition cursor-pointer appearance-none shadow-sm"
            >
              <option value="priority">🔥 Sort: Priority</option>
              <option value="newest">🕒 Sort: Newest</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            title="Refresh Data"
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 p-2.5 rounded-xl transition flex items-center justify-center relative cursor-pointer shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isPolling ? 'animate-spin text-teal-600' : ''}`} />
            {isPolling && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
