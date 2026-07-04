import React from 'react';
import { CATEGORIES } from '../mockData';
import { X, History, ShieldCheck, MapPin, AlertCircle, Image } from 'lucide-react';

export default function SidePanel({ isOpen, onClose, reports, currentUser, onLoginClick, onLogout }) {
  const userReports = currentUser 
    ? reports.filter(r => r.user_id === currentUser.id) 
    : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'text-emerald-400 bg-emerald-950/30 border-emerald-900/40';
      case 'in_progress': return 'text-blue-400 bg-blue-950/30 border-blue-900/40';
      case 'resolved_pending_confirmation': return 'text-emerald-400 bg-emerald-950/35 border-emerald-900/30';
      case 'pending': return 'text-slate-400 bg-slate-800 border-slate-700';
      case 'reopened': return 'text-red-400 bg-red-950/30 border-red-900/40';
      default: return 'text-slate-400 bg-slate-950 border-slate-800';
    }
  };

  return (
    <div className={`fixed top-0 right-0 bottom-0 w-full md:w-96 bg-slate-900 border-l border-slate-800/80 z-[2000] shadow-2xl transition-transform duration-300 transform flex flex-col font-body ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800/60 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-2">
          <History className="h-5.5 w-5.5 text-orange-500" />
          <div className="text-left">
            <h2 className="text-slate-100 font-display font-extrabold text-sm uppercase tracking-wider leading-none">My Submissions</h2>
            {currentUser && (
              <span className="text-[9px] text-teal-400 font-mono font-bold uppercase block mt-1.5">
                👤 {currentUser.name} {currentUser.verified && "✓"}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentUser && onLogout && (
            <button
              onClick={onLogout}
              className="text-[9px] font-mono font-bold uppercase tracking-wider bg-red-950/40 text-red-400 hover:bg-red-900/40 px-2.5 py-1 rounded-lg border border-red-900/40 transition cursor-pointer"
              title="Sign Out"
            >
              Logout
            </button>
          )}
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Critical Pitch Stats (Warning Banner) */}
      <div className="bg-red-950/20 border-b border-red-900/20 p-4 space-y-2 text-left">
        <div className="flex items-center gap-1.5 text-red-400 font-bold">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span className="text-[9px] font-mono uppercase tracking-widest">National Crisis Scale</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-semibold">
          "10,476 Indians died last year from potholes. Not because we don't know where they are — because nobody is accountable. TraceSpark changes that."
        </p>
        <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
          <div className="bg-slate-950 p-2 border border-red-900/30 rounded-xl">
            <span className="text-red-400 font-extrabold text-xs block">10,476</span>
            <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Deaths/Yr</span>
          </div>
          <div className="bg-slate-950 p-2 border border-red-900/30 rounded-xl">
            <span className="text-red-400 font-extrabold text-xs block">3.5L km</span>
            <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Bad Roads</span>
          </div>
          <div className="bg-slate-950 p-2 border border-red-900/30 rounded-xl">
            <span className="text-red-400 font-extrabold text-xs block">100%</span>
            <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">AI Vision</span>
          </div>
        </div>
      </div>
 
      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
        <div className="space-y-3">
          {!currentUser ? (
            <div className="text-center py-10 space-y-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <ShieldCheck className="h-8 w-8 text-slate-500 mx-auto" />
              <div className="space-y-1 text-center">
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">Authentication Required</h4>
                <p className="text-[10px] text-slate-500 max-w-[220px] mx-auto leading-normal">
                  Log in with Supabase Phone OTP to track your reported tickets and earn impact points.
                </p>
              </div>
              <button
                onClick={onLoginClick}
                className="bg-gradient-to-r from-orange-500 to-red-650 text-white font-extrabold text-[10px] font-mono tracking-widest uppercase py-2.5 px-4 rounded-xl cursor-pointer transition shadow"
              >
                Log In Now
              </button>
            </div>
          ) : userReports.length === 0 ? (
            <div className="text-center py-10 bg-slate-900 border border-slate-850 rounded-2xl p-4 text-slate-500 text-xs shadow-sm">
              <p>No complaints submitted yet.</p>
              <p className="text-[9px] text-slate-600 font-mono uppercase tracking-wider mt-1.5">
                Tap anywhere on the map to file a report.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[9px] text-slate-450 text-left font-mono font-bold uppercase tracking-widest ml-1">
                📂 Submissions by you
              </p>
              {userReports.map((report) => {
                const cat = CATEGORIES[report.category] || { label: report.category, icon: '📍' };
                const isResolved = report.status === 'resolved';

                return (
                  <div 
                    key={report.id}
                    className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex flex-col hover:border-slate-700/80 transition text-left shadow-md"
                  >
                    <div className="flex items-start gap-3 w-full">
                      <span className="text-2xl bg-slate-950 p-2 rounded-xl border border-slate-850">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-200 truncate uppercase font-mono tracking-wide">{cat.label}</h4>
                          <span className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded-full border font-bold ${getStatusColor(report.status)}`}>
                            {report.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 font-medium">{report.description}</p>
                        <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-slate-850 text-[8px] text-slate-550 font-mono tracking-wide">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            {report.ward}
                          </span>
                          <span className="font-bold text-orange-400">🔥 {report.priority_score} Rating</span>
                        </div>
                      </div>
                    </div>

                    {/* Before & After Proof comparisons */}
                    {isResolved && report.resolution_photo_url && (
                      <div className="mt-4 pt-3 border-t border-slate-850/80">
                        <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2 block">Before / After Comparison</span>
                        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2 rounded-xl border border-slate-850/60 shrink-0 select-none">
                          <div className="relative rounded overflow-hidden aspect-video bg-slate-900">
                            <img src={report.photo_url} className="w-full h-full object-cover" alt="Before" />
                            <span className="absolute bottom-1 left-1 bg-red-600/80 backdrop-blur-xs text-white text-[7px] px-1 rounded font-mono font-bold uppercase tracking-wider">Before</span>
                          </div>
                          <div className="relative rounded overflow-hidden aspect-video bg-slate-900">
                            <img src={report.resolution_photo_url} className="w-full h-full object-cover" alt="After" />
                            <span className="absolute bottom-1 left-1 bg-emerald-600/80 backdrop-blur-xs text-white text-[7px] px-1 rounded font-mono font-bold uppercase tracking-wider">After</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
