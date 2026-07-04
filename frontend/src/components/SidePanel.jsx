import React, { useState } from 'react';
import { MOCK_LEADERBOARD, CATEGORIES } from '../mockData';
import { X, Award, History, TrendingUp, ShieldCheck, MapPin, AlertCircle } from 'lucide-react';

export default function SidePanel({ isOpen, onClose, reports, currentUser, onLoginClick }) {
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' or 'history'

  const userReports = currentUser 
    ? reports.filter(r => r.user_id === currentUser.id) 
    : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'text-teal-600 bg-teal-500/10 border-teal-500/20';
      case 'in_progress': return 'text-blue-600 bg-blue-500/10 border-blue-500/20';
      case 'resolved_pending_confirmation': return 'text-teal-600 bg-teal-500/10 border-teal-500/30';
      case 'pending': return 'text-slate-500 bg-slate-100 border-slate-200/60';
      case 'reopened': return 'text-red-600 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className={`fixed top-0 right-0 bottom-0 w-full md:w-96 bg-white/95 backdrop-blur-lg border-l border-slate-200 z-[2000] shadow-2xl transition-transform duration-300 transform flex flex-col font-body ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <Award className="h-5.5 w-5.5 text-orange-500" />
          <h2 className="text-slate-800 font-display font-extrabold text-sm uppercase tracking-wider">Citizen Center</h2>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-200 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Critical Pitch Stats (Warning Banner) */}
      <div className="bg-red-50 border-b border-red-100 p-4 space-y-2 text-left">
        <div className="flex items-center gap-1.5 text-red-600 font-bold">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-[9px] font-mono uppercase tracking-widest">National Crisis Scale</span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          "10,476 Indians died last year from potholes. Not because we don't know where they are — because nobody is accountable. TraceSpark changes that."
        </p>
        <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
          <div className="bg-white p-2 border border-red-200/50 rounded-xl">
            <span className="text-red-600 font-extrabold text-xs block">10,476</span>
            <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Deaths/Yr</span>
          </div>
          <div className="bg-white p-2 border border-red-200/50 rounded-xl">
            <span className="text-red-600 font-extrabold text-xs block">3.5L km</span>
            <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Bad Roads</span>
          </div>
          <div className="bg-white p-2 border border-red-200/50 rounded-xl">
            <span className="text-red-600 font-extrabold text-xs block">100%</span>
            <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">AI Vision</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 font-mono uppercase text-[9px] tracking-widest">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-3.5 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'leaderboard'
              ? 'text-teal-600 border-b-2 border-teal-600 bg-white'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <TrendingUp className="h-4 w-4 text-teal-600" />
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3.5 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'history'
              ? 'text-teal-600 border-b-2 border-teal-600 bg-white'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <History className="h-4 w-4 text-teal-600" />
          My Reports ({userReports.length})
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
        
        {/* LEADERBOARD VIEW */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-3">
            <p className="text-[9px] text-slate-400 text-left font-mono font-bold uppercase tracking-widest">
              🏆 Top Impact Makers (Ward Leaderboard)
            </p>
            
            <div className="space-y-2">
              {MOCK_LEADERBOARD.map((item) => (
                <div 
                  key={item.rank}
                  className={`border rounded-xl p-3.5 flex items-center justify-between text-left transition ${
                    item.rank === 1 
                      ? 'bg-teal-50/40 border-teal-200 shadow-sm' 
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold font-mono ${
                      item.rank === 1 ? 'bg-orange-500 text-white shadow-md' :
                      item.rank === 2 ? 'bg-teal-600 text-white' :
                      item.rank === 3 ? 'bg-slate-200 text-slate-700' :
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {item.rank}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1.5">
                        {item.name}
                        {item.rank === 1 && <span className="text-[10px]">👑</span>}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-mono tracking-wide mt-0.5">{item.ward}</p>
                      
                      {/* Badges */}
                      <div className="flex flex-wrap gap-1 mt-1.5 font-mono text-[8px] uppercase tracking-wider text-teal-600">
                        {item.badges.map(badge => (
                          <span key={badge} className="bg-teal-50 border border-teal-100 px-1.5 py-0.2 rounded-full">
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-xs font-extrabold text-teal-600 block">{item.points} pts</span>
                    <span className="text-[8px] text-slate-400 tracking-wide">{item.reportsCount} reported</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MY REPORTS VIEW */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {!currentUser ? (
              <div className="text-center py-10 space-y-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <ShieldCheck className="h-8 w-8 text-slate-400 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-widest">Authentication Required</h4>
                  <p className="text-[10px] text-slate-400 max-w-[220px] mx-auto leading-normal">
                    Log in with Supabase Phone OTP to track your reported tickets and earn impact points.
                  </p>
                </div>
                <button
                  onClick={onLoginClick}
                  className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-extrabold text-[10px] font-mono tracking-widest uppercase py-2 px-4 rounded-xl cursor-pointer transition shadow"
                >
                  Log In Now
                </button>
              </div>
            ) : userReports.length === 0 ? (
              <div className="text-center py-10 bg-white border border-slate-200 rounded-xl p-4 text-slate-400 text-xs shadow-sm">
                <p>No complaints submitted yet.</p>
                <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider mt-1.5">
                  Tap anywhere on the map to file a report.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[9px] text-slate-400 text-left font-mono font-bold uppercase tracking-widest">
                  📂 Submissions by you
                </p>
                {userReports.map((report) => {
                  const cat = CATEGORIES[report.category] || { label: report.category, icon: '📍' };
                  return (
                    <div 
                      key={report.id}
                      className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-start gap-3 hover:border-slate-300 transition text-left shadow-sm"
                    >
                      <span className="text-2xl bg-slate-50 p-2 rounded-xl border border-slate-100">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-800 truncate uppercase font-mono tracking-wide">{cat.label}</h4>
                          <span className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded-full border font-bold ${getStatusColor(report.status)}`}>
                            {report.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 font-medium">{report.description}</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[8px] text-slate-400 font-mono tracking-wide">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {report.ward}
                          </span>
                          <span className="font-bold text-orange-500">🔥 {report.priority_score} votes</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
