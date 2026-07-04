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
      case 'resolved': return 'text-verdigris-patina bg-verdigris-patina/10 border-verdigris-patina/30';
      case 'in_progress': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'resolved_pending_confirmation': return 'text-verdigris-patina bg-verdigris-patina/10 border-verdigris-patina/40';
      case 'pending': return 'text-text-muted bg-graphite/50 border-white/5';
      case 'reopened': return 'text-vermilion-warning bg-vermilion-warning/10 border-vermilion-warning/30';
      default: return 'text-text-warm bg-graphite border-white/5';
    }
  };

  return (
    <div className={`fixed top-0 right-0 bottom-0 w-full md:w-96 bg-raised-lacquer/95 backdrop-blur-lg border-l border-white/10 z-[2000] shadow-2xl transition-transform duration-300 transform flex flex-col font-body ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      
      {/* Panel Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-lacquer-deep">
        <div className="flex items-center gap-2">
          <Award className="h-5.5 w-5.5 text-kinpaku-gold" />
          <h2 className="text-champagne font-display font-light text-xl uppercase tracking-wider">Citizen Center</h2>
        </div>
        <button 
          onClick={onClose}
          className="text-text-muted hover:text-champagne p-1 rounded-none hover:bg-graphite transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Critical Pitch Stats (Warning Banner in Vermilion/Lacquer) */}
      <div className="bg-vermilion-warning/5 border-b border-vermilion-warning/10 p-4 space-y-2 text-left">
        <div className="flex items-center gap-1.5 text-vermilion-warning">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-[9px] font-mono font-black uppercase tracking-widest">National Crisis Scale</span>
        </div>
        <p className="text-xs text-text-warm leading-relaxed font-medium">
          "10,476 Indians died last year from potholes. Not because we don't know where they are — because nobody is accountable. Bharat Patrol changes that."
        </p>
        <div className="grid grid-cols-3 gap-2 pt-1.5 text-center font-mono">
          <div className="bg-lacquer-deep p-2 border border-vermilion-warning/20">
            <span className="text-vermilion-warning font-extrabold text-xs block">10,476</span>
            <span className="text-[8px] text-text-muted uppercase font-bold tracking-wider">Deaths/Yr</span>
          </div>
          <div className="bg-lacquer-deep p-2 border border-vermilion-warning/20">
            <span className="text-vermilion-warning font-extrabold text-xs block">3.5L km</span>
            <span className="text-[8px] text-text-muted uppercase font-bold tracking-wider">Bad Roads</span>
          </div>
          <div className="bg-lacquer-deep p-2 border border-vermilion-warning/20">
            <span className="text-vermilion-warning font-extrabold text-xs block">100%</span>
            <span className="text-[8px] text-text-muted uppercase font-bold tracking-wider">AI Vision</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-white/5 bg-lacquer-deep font-mono uppercase text-[10px] tracking-widest">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-3.5 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'leaderboard'
              ? 'text-kinpaku-gold border-b border-kinpaku-gold bg-graphite/10'
              : 'text-text-muted hover:text-champagne'
          }`}
        >
          <TrendingUp className="h-4 w-4 text-kinpaku-gold" />
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3.5 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'history'
              ? 'text-kinpaku-gold border-b border-kinpaku-gold bg-graphite/10'
              : 'text-text-muted hover:text-champagne'
          }`}
        >
          <History className="h-4 w-4 text-kinpaku-gold" />
          My Reports ({userReports.length})
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-raised-lacquer">
        
        {/* LEADERBOARD VIEW */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-3">
            <p className="text-[9px] text-text-muted text-left font-mono font-bold uppercase tracking-widest">
              🏆 Top Impact Makers (Ward Leaderboard)
            </p>
            
            <div className="space-y-2">
              {MOCK_LEADERBOARD.map((item) => (
                <div 
                  key={item.rank}
                  className={`border rounded-none p-3.5 flex items-center justify-between text-left transition ${
                    item.rank === 1 
                      ? 'bg-kinpaku-gold/5 border-kinpaku-gold/20' 
                      : 'bg-graphite/30 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-none flex items-center justify-center text-xs font-extrabold font-mono ${
                      item.rank === 1 ? 'bg-kinpaku-gold text-lacquer-deep shadow-md' :
                      item.rank === 2 ? 'bg-verdigris-patina text-lacquer-deep' :
                      item.rank === 3 ? 'bg-white/15 text-champagne border border-white/10' :
                      'bg-lacquer-deep text-text-muted'
                    }`}>
                      {item.rank}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-champagne leading-tight flex items-center gap-1.5">
                        {item.name}
                        {item.rank === 1 && <span className="text-[10px]">👑</span>}
                      </h4>
                      <p className="text-[9px] text-text-muted font-mono tracking-wide mt-0.5">{item.ward}</p>
                      
                      {/* Badges */}
                      <div className="flex flex-wrap gap-1 mt-1.5 font-mono text-[8px] uppercase tracking-wider">
                        {item.badges.map(badge => (
                          <span key={badge} className="bg-lacquer-deep border border-white/5 text-kinpaku-gold px-1 py-0.2 rounded-none">
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-xs font-extrabold text-kinpaku-gold block">{item.points} pts</span>
                    <span className="text-[8px] text-text-muted tracking-wide">{item.reportsCount} reported</span>
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
              <div className="text-center py-10 space-y-4 bg-lacquer-deep border border-white/5 rounded-none p-4">
                <ShieldCheck className="h-8 w-8 text-text-muted mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-xs font-mono font-bold text-champagne uppercase tracking-widest">Authentication Required</h4>
                  <p className="text-[10px] text-text-muted max-w-[220px] mx-auto leading-normal">
                    Log in with Supabase Phone OTP to track your reported tickets and earn impact points.
                  </p>
                </div>
                <button
                  onClick={onLoginClick}
                  className="bg-kinpaku-gold hover:bg-kinpaku-pale text-lacquer-deep font-extrabold text-[10px] font-mono tracking-widest uppercase py-2 px-4 rounded-none cursor-pointer transition shadow"
                >
                  Log In Now
                </button>
              </div>
            ) : userReports.length === 0 ? (
              <div className="text-center py-10 bg-lacquer-deep border border-white/5 rounded-none p-4 text-text-muted text-xs">
                <p>No complaints submitted yet.</p>
                <p className="text-[9px] text-text-faint font-mono uppercase tracking-wider mt-1.5">
                  Tap anywhere on the map to file a report.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[9px] text-text-muted text-left font-mono font-bold uppercase tracking-widest">
                  📂 Submissions by you
                </p>
                {userReports.map((report) => {
                  const cat = CATEGORIES[report.category] || { label: report.category, icon: '📍' };
                  return (
                    <div 
                      key={report.id}
                      className="bg-graphite/35 border border-white/5 rounded-none p-3.5 flex items-start gap-3 hover:border-white/10 transition text-left"
                    >
                      <span className="text-2xl bg-lacquer-deep p-2 rounded-none border border-white/5">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-champagne truncate uppercase font-mono tracking-wide">{cat.label}</h4>
                          <span className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded-none border font-bold ${getStatusColor(report.status)}`}>
                            {report.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-warm line-clamp-1 mt-0.5 font-medium">{report.description}</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[8px] text-text-muted font-mono tracking-wide">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-text-faint" />
                            {report.ward}
                          </span>
                          <span className="font-bold text-kinpaku-gold">🔥 {report.priority_score} votes</span>
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
