import React, { useState } from 'react';
import { CATEGORIES } from '../mockData';
import { ThumbsUp, Calendar, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function ReportPopup({ report, onVote }) {
  const [voting, setVoting] = useState(false);
  const categoryInfo = CATEGORIES[report.category] || { label: report.category, icon: '📍' };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[9px] px-2.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider">Verification Pending</span>;
      case 'live':
        return <span className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-[9px] px-2.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider animate-pulse">AI Verified Live</span>;
      case 'rejected':
        return <span className="bg-rose-50 border border-rose-200 text-rose-600 text-[9px] px-2.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider">AI Rejected</span>;
      default:
        return <span className="bg-slate-105 border border-slate-200 text-slate-500 text-[9px] px-2.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider">{status}</span>;
    }
  };

  const getSeverityBadge = (severity) => {
    const score = parseInt(severity) || 1;
    if (score >= 8) {
      return <span className="bg-red-100 text-red-700 border border-red-200 text-[8px] px-2 py-0.5 rounded-full font-extrabold uppercase font-mono tracking-wider">Critical ({score})</span>;
    } else if (score >= 5) {
      return <span className="bg-orange-100 text-orange-700 border border-orange-250 text-[8px] px-2 py-0.5 rounded-full font-extrabold uppercase font-mono tracking-wider">High ({score})</span>;
    } else if (score >= 3) {
      return <span className="bg-yellow-100 text-yellow-705 border border-yellow-200 text-[8px] px-2 py-0.5 rounded-full font-extrabold uppercase font-mono tracking-wider">Medium ({score})</span>;
    } else {
      return <span className="bg-slate-100 text-slate-650 border border-slate-200 text-[8px] px-2 py-0.5 rounded-full font-extrabold uppercase font-mono tracking-wider">Low ({score})</span>;
    }
  };

  const handleVote = async () => {
    if (voting) return;
    setVoting(true);
    try {
      await onVote(report.id);
    } catch (err) {
      console.error(err);
    } finally {
      setVoting(false);
    }
  };

  const formattedDate = report.created_at 
    ? new Date(report.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Unknown Date';

  return (
    <div className="w-80 flex flex-col max-h-[420px] text-slate-800 font-body bg-white rounded-2xl overflow-hidden shadow-xl">
      {/* Photo Header */}
      <div className="relative h-40 w-full overflow-hidden bg-slate-100">
        <img 
          src={report.photo_url} 
          alt={categoryInfo.label} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // fallback if base64 upload or preset image breaks
            e.target.src = "https://images.unsplash.com/photo-1599740831464-54c86b24d775?auto=format&fit=crop&w=400&q=80";
          }}
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {getStatusBadge(report.status)}
        </div>
        
        {/* Category Label Overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent p-3 pt-8 flex items-end justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl bg-slate-900/40 p-1.5 rounded-xl border border-white/10 backdrop-blur-xs">{categoryInfo.icon}</span>
            <div className="text-left">
              <h3 className="font-display font-extrabold text-sm leading-none text-white tracking-tight uppercase">{categoryInfo.label}</h3>
              <p className="text-[9px] text-slate-300 font-mono tracking-wider mt-0.5">{report.ward || "Hyderabad Division"}</p>
            </div>
          </div>
          {getSeverityBadge(report.ai_severity)}
        </div>
      </div>

      {/* Details Container */}
      <div className="p-4 space-y-3.5 overflow-y-auto flex-1 bg-white border-t border-slate-100">
        
        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed text-left font-medium">
          {report.description || 'AI description processing...'}
        </p>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-[9px] bg-slate-50 border border-slate-100 p-2.5 rounded-xl font-mono text-slate-600">
          <div className="flex flex-col text-left">
            <span className="text-slate-400 uppercase font-bold tracking-wider">Reported On</span>
            <span className="text-slate-700 flex items-center gap-1 mt-0.5 font-bold">
              <Calendar className="h-3 w-3 text-slate-450" />
              {formattedDate}
            </span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-slate-400 uppercase font-bold tracking-wider">AI Check</span>
            <span className="text-slate-700 flex items-center gap-1 mt-0.5 font-bold">
              {report.ai_verified ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                  <span className="text-emerald-600 font-extrabold uppercase">Verified</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-slate-500 font-extrabold uppercase">Unverified</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Voting & Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3.5">
          <div className="flex flex-col text-left">
            <span className="text-[9px] text-slate-400 uppercase font-mono font-bold tracking-widest">Priority Score</span>
            <span className="text-slate-800 font-extrabold text-sm flex items-center gap-1 font-mono">
              🔥 {report.priority_score || 0} votes
              {(report.priority_score || 0) >= 25 && (
                <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.2 rounded font-mono uppercase tracking-wide shrink-0 animate-pulse">Escalated</span>
              )}
            </span>
          </div>

          {report.status !== 'rejected' && (
            <button
              type="button"
              onClick={handleVote}
              disabled={voting}
              className="bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 hover:border-orange-500/35 py-1.5 px-3.5 rounded-xl text-xs font-bold font-mono uppercase tracking-widest transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-40"
            >
              <ThumbsUp className={`h-3.5 w-3.5 text-orange-500 ${voting ? 'animate-bounce' : ''}`} />
              Upvote
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
