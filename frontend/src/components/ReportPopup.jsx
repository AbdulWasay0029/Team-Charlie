import React, { useState } from 'react';
import { CATEGORIES } from '../mockData';
import { ThumbsUp, Calendar, ShieldCheck, ShieldAlert, AlertTriangle, User, ZoomIn } from 'lucide-react';

export default function ReportPopup({ report, onVote, hasVoted, onOpenImage }) {
  const [voting, setVoting] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  
  const clustered = report.clusteredReports || [report];
  const currentReport = clustered[photoIdx] || report;
  const totalPhotos = clustered.length;

  const categoryInfo = CATEGORIES[currentReport.category] || { label: currentReport.category, icon: '📍' };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
      case 'rejected':
        return <span className="bg-slate-800 border border-slate-700 text-slate-400 text-[9px] px-2.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider flex items-center gap-1">🔍 Pending Audit</span>;
      case 'live':
      case 'reopened':
        return <span className="bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 text-[9px] px-2.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider flex items-center gap-1 animate-pulse">⚡ Live & Verified</span>;
      case 'in_progress':
        return <span className="bg-blue-950/40 border border-blue-900/30 text-blue-400 text-[9px] px-2.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider flex items-center gap-1">🚧 In Progress</span>;
      case 'resolved':
      case 'resolved_pending_confirmation':
        return <span className="bg-teal-950/40 border border-teal-900/30 text-teal-400 text-[9px] px-2.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider flex items-center gap-1">✅ Resolved</span>;
      default:
        return <span className="bg-slate-800 border border-slate-700 text-slate-400 text-[9px] px-2.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider">{status}</span>;
    }
  };

  const getSeverityBadge = (severity) => {
    const score = parseInt(severity) || 1;
    if (score >= 8) {
      return <span className="bg-red-950/30 text-red-400 border border-red-900/30 text-[8px] px-2 py-0.5 rounded-full font-extrabold uppercase font-mono tracking-wider">Critical ({score})</span>;
    } else if (score >= 5) {
      return <span className="bg-orange-950/30 text-orange-400 border border-orange-900/30 text-[8px] px-2 py-0.5 rounded-full font-extrabold uppercase font-mono tracking-wider">High ({score})</span>;
    } else if (score >= 3) {
      return <span className="bg-yellow-950/30 text-yellow-400 border border-yellow-900/30 text-[8px] px-2 py-0.5 rounded-full font-extrabold uppercase font-mono tracking-wider">Medium ({score})</span>;
    } else {
      return <span className="bg-slate-800 text-slate-450 border border-slate-700 text-[8px] px-2 py-0.5 rounded-full font-extrabold uppercase font-mono tracking-wider">Low ({score})</span>;
    }
  };

  const handleVote = async () => {
    if (voting || hasVoted) return;
    setVoting(true);
    try {
      await onVote(currentReport.id);
    } catch (err) {
      console.error(err);
    } finally {
      setVoting(false);
    }
  };

  const formattedDate = currentReport.created_at 
    ? new Date(currentReport.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Unknown Date';

  // Severity-Weighted calculation details
  const totalScore = currentReport.priority_score || 0;
  const severity = currentReport.ai_severity || 1;
  const severityBoost = severity * 3;
  const computedVotes = Math.max(0, totalScore - severityBoost);

  const handleImageClick = (e) => {
    e.stopPropagation();
    if (onOpenImage) {
      onOpenImage({
        imageUrl: currentReport.photo_url,
        title: `${categoryInfo.label} Evidence`,
        subtitle: currentReport.description,
        reporter: currentReport.reporter_name || "Verified Citizen",
        timestamp: currentReport.created_at,
        severity: currentReport.ai_severity
      });
    }
  };

  return (
    <div className="w-80 flex flex-col max-h-[440px] text-slate-100 font-body bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80">
      {/* Photo Header */}
      <div 
        className="relative h-40 w-full overflow-hidden bg-slate-950 group shrink-0 cursor-pointer"
        onClick={handleImageClick}
        title="Click to expand high-resolution evidence photo"
      >
        <img 
          src={currentReport.photo_url} 
          alt={categoryInfo.label} 
          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:opacity-85"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1599740831464-54c86b24d775?auto=format&fit=crop&w=400&q=80";
          }}
        />

        {/* Hover Zoom Overlay */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
          <div className="bg-slate-900/90 border border-slate-700/80 text-white px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md">
            <ZoomIn className="w-3.5 h-3.5 text-orange-400" />
            <span>Click to Expand</span>
          </div>
        </div>
        
        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10 pointer-events-none">
          {getStatusBadge(currentReport.status)}
        </div>
        
        {totalPhotos > 1 && (
          <div className="absolute top-2 right-2 z-10 bg-slate-950/80 backdrop-blur-md text-slate-200 text-[9px] px-2 py-0.5 rounded-full font-bold font-mono border border-slate-800/50 pointer-events-none">
            📸 {photoIdx + 1}/{totalPhotos} Stacked
          </div>
        )}

        {/* Carousel Navigation Buttons */}
        {totalPhotos > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPhotoIdx((photoIdx - 1 + totalPhotos) % totalPhotos);
              }}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/85 text-white w-6 h-6 rounded-full flex items-center justify-center z-30 transition cursor-pointer text-xs font-bold"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPhotoIdx((photoIdx + 1) % totalPhotos);
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/85 text-white w-6 h-6 rounded-full flex items-center justify-center z-30 transition cursor-pointer text-xs font-bold"
            >
              ▶
            </button>
          </>
        )}
        
        {/* Category Label Overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent p-3 pt-8 flex items-end justify-between text-white pointer-events-none z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl bg-slate-950/70 p-1.5 rounded-xl border border-slate-850/50 backdrop-blur-xs">{categoryInfo.icon}</span>
            <div className="text-left">
              <h3 className="font-display font-extrabold text-sm leading-none text-white tracking-tight uppercase">{categoryInfo.label}</h3>
              <p className="text-[9px] text-slate-400 font-mono tracking-wider mt-0.5">{currentReport.ward || "Hyderabad Division"}</p>
            </div>
          </div>
          {getSeverityBadge(currentReport.ai_severity)}
        </div>
      </div>

      {/* Details Container */}
      <div className="p-4 space-y-3 overflow-y-auto flex-1 bg-slate-900 border-t border-slate-800/80">
        
        {/* Reporter Identity Section */}
        <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800/80 px-3 py-1.5 rounded-xl text-[10px] font-mono">
          <span className="text-slate-400 flex items-center gap-1.5 truncate">
            <User className="w-3 h-3 text-orange-400 shrink-0" />
            <span className="truncate">Reported by: <strong className="text-slate-200 font-bold">{currentReport.reporter_name || "Verified Citizen"}</strong></span>
          </span>
          <span className="text-emerald-400 font-bold shrink-0 ml-2">✓ Verified</span>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-350 leading-relaxed text-left font-medium">
          {currentReport.description || 'AI description processing...'}
        </p>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-[9px] bg-slate-950 border border-slate-850 p-2 rounded-xl font-mono text-slate-400">
          <div className="flex flex-col text-left">
            <span className="text-slate-500 uppercase font-bold tracking-wider">Reported On</span>
            <span className="text-slate-300 flex items-center gap-1 mt-0.5 font-bold">
              <Calendar className="h-3 w-3 text-slate-500" />
              {formattedDate}
            </span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-slate-500 uppercase font-bold tracking-wider">AI Check</span>
            <span className="text-slate-300 flex items-center gap-1 mt-0.5 font-bold">
              {currentReport.ai_verified ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-400 font-extrabold uppercase">Verified</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-slate-450 font-extrabold uppercase">Unverified</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Voting & Actions */}
        <div className="flex items-center justify-between border-t border-slate-800/60 pt-3">
          <div className="flex flex-col text-left">
            <span className="text-[9px] text-slate-500 uppercase font-mono font-bold tracking-widest">Priority Rating</span>
            <span className="text-slate-200 font-extrabold text-xs flex flex-col font-mono text-left mt-0.5">
              <span className="flex items-center gap-1">
                🔥 {totalScore}/25
                {totalScore >= 25 && currentReport.status !== 'resolved' && (
                  <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.2 rounded font-mono uppercase tracking-wide shrink-0 animate-pulse">Escalated</span>
                )}
              </span>
              <span className="text-[8px] text-slate-500 font-normal leading-normal font-sans block mt-0.5">
                ({computedVotes} {computedVotes === 1 ? 'vote' : 'votes'} + {severityBoost} severity boost)
              </span>
            </span>
          </div>

          {currentReport.status !== 'rejected' && currentReport.status !== 'resolved' && (
            <button
              type="button"
              onClick={handleVote}
              disabled={voting || hasVoted}
              className={`border py-1.5 px-3.5 rounded-xl text-xs font-bold font-mono uppercase tracking-widest transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                hasVoted 
                  ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' 
                  : 'bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-200 border-slate-750 hover:border-orange-500/35'
              }`}
            >
              <ThumbsUp className={`h-3.5 w-3.5 ${hasVoted ? 'text-emerald-400' : 'text-orange-500'} ${voting ? 'animate-bounce' : ''}`} />
              {hasVoted ? 'Voted' : 'Upvote'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
