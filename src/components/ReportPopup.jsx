import React, { useState } from 'react';
import { CATEGORIES } from '../mockData';
import { ThumbsUp, AlertTriangle, CheckCircle, XCircle, Calendar, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function ReportPopup({ report, onVote, onConfirmResolution }) {
  const [voting, setVoting] = useState(false);
  const [submittingConfirmation, setSubmittingConfirmation] = useState(false);
  
  const categoryInfo = CATEGORIES[report.category] || { label: report.category, icon: '❓' };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="bg-graphite border border-white/10 text-text-muted text-[9px] px-2 py-0.5 rounded-none font-bold font-mono uppercase tracking-wider">Verification Pending</span>;
      case 'live':
        return <span className="bg-kinpaku-gold/10 text-kinpaku-gold border border-kinpaku-gold/30 text-[9px] px-2 py-0.5 rounded-none font-bold font-mono uppercase tracking-wider animate-pulse">Live</span>;
      case 'in_progress':
        return <span className="bg-blue-900/20 text-blue-400 border border-blue-500/30 text-[9px] px-2 py-0.5 rounded-none font-bold font-mono uppercase tracking-wider">In Progress</span>;
      case 'resolved_pending_confirmation':
        return <span className="bg-verdigris-patina text-lacquer-deep text-[9px] px-2 py-0.5 rounded-none font-black font-mono uppercase tracking-widest animate-pulse">Needs Citizen Action</span>;
      case 'resolved':
        return <span className="bg-verdigris-patina/15 text-verdigris-patina border border-verdigris-patina/30 text-[9px] px-2 py-0.5 rounded-none font-bold font-mono uppercase tracking-wider">Resolved</span>;
      case 'reopened':
        return <span className="bg-vermilion-warning text-champagne border border-vermilion-warning text-[9px] px-2 py-0.5 rounded-none font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 animate-bounce">🚨 Reopened</span>;
      case 'rejected':
        return <span className="bg-slate-800 text-text-muted border border-white/5 text-[9px] px-2 py-0.5 rounded-none font-bold font-mono uppercase tracking-wider">Rejected</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 border border-white/5 text-[9px] px-2 py-0.5 rounded-none font-bold font-mono uppercase tracking-wider">{status}</span>;
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <span className="bg-vermilion-warning text-champagne border border-vermilion-warning text-[8px] px-1.5 py-0.2 rounded-none font-extrabold uppercase font-mono tracking-wider">Critical</span>;
      case 'high':
        return <span className="bg-vermilion-warning/20 text-vermilion-warning border border-vermilion-warning/40 text-[8px] px-1.5 py-0.2 rounded-none font-extrabold uppercase font-mono tracking-wider">High</span>;
      case 'medium':
        return <span className="bg-kinpaku-gold/15 text-kinpaku-gold border border-kinpaku-gold/30 text-[8px] px-1.5 py-0.2 rounded-none font-extrabold uppercase font-mono tracking-wider">Medium</span>;
      case 'low':
        return <span className="bg-graphite text-text-muted border border-white/5 text-[8px] px-1.5 py-0.2 rounded-none font-extrabold uppercase font-mono tracking-wider">Low</span>;
      default:
        return null;
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

  const handleConfirmation = async (confirmed) => {
    if (submittingConfirmation) return;
    setSubmittingConfirmation(true);
    try {
      await onConfirmResolution(report.id, confirmed);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingConfirmation(false);
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
    <div className="w-80 flex flex-col max-h-[480px] text-text-warm font-body bg-raised-lacquer">
      {/* Photo Header */}
      <div className="relative h-40 w-full overflow-hidden bg-lacquer-deep">
        <img 
          src={report.photo_url} 
          alt={categoryInfo.label} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {getStatusBadge(report.status)}
        </div>
        
        {/* Category Label Overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-lacquer-black to-transparent p-3 pt-8 flex items-end justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xl bg-lacquer-deep p-1.5 rounded-none border border-white/10">{categoryInfo.icon}</span>
            <div className="text-left">
              <h3 className="font-display font-light text-xl text-champagne leading-none uppercase tracking-wide">{categoryInfo.label}</h3>
              <p className="text-[9px] text-text-muted font-mono tracking-wider mt-0.5">{report.ward || "Hyderabad Division"}</p>
            </div>
          </div>
          {getSeverityBadge(report.ai_severity)}
        </div>
      </div>

      {/* Details Container */}
      <div className="p-4 space-y-3.5 overflow-y-auto flex-1 bg-raised-lacquer border-t border-white/5">
        
        {/* Description */}
        <p className="text-xs text-text-warm leading-relaxed text-left font-medium">
          {report.description}
        </p>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-[9px] bg-lacquer-deep p-2.5 rounded-none border border-white/5 font-mono">
          <div className="flex flex-col text-left">
            <span className="text-text-muted uppercase font-bold tracking-wider">Reported On</span>
            <span className="text-champagne flex items-center gap-1 mt-0.5 font-bold">
              <Calendar className="h-3 w-3 text-text-muted" />
              {formattedDate}
            </span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-text-muted uppercase font-bold tracking-wider">Verification</span>
            <span className="text-champagne flex items-center gap-1 mt-0.5 font-bold">
              {report.ai_verified ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-verdigris-patina" />
                  <span className="text-verdigris-patina font-extrabold uppercase">AI Verified</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-3.5 w-3.5 text-kinpaku-gold" />
                  <span className="text-kinpaku-gold font-extrabold uppercase">Unverified</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* CITIZEN ACCOUNTABILITY LOOP (Pending Citizen Action) */}
        {report.status === 'resolved_pending_confirmation' && (
          <div className="border border-verdigris-patina/30 bg-verdigris-patina/5 rounded-none p-3 space-y-3 text-left">
            <div className="flex items-center gap-1.5 text-verdigris-patina text-xs font-black uppercase font-mono tracking-widest">
              <AlertTriangle className="h-4 w-4 text-verdigris-patina" />
              <span>Citizen Action Required</span>
            </div>
            
            {report.resolution_photo_url && (
              <div className="space-y-1">
                <span className="text-[9px] text-text-muted font-mono font-bold tracking-widest block uppercase">Resolution Evidence:</span>
                <div className="h-24 w-full rounded-none overflow-hidden border border-white/10 relative">
                  <img 
                    src={report.resolution_photo_url} 
                    alt="Resolution Evidence" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 right-1 bg-verdigris-patina text-lacquer-deep font-extrabold text-[8px] px-1.5 py-0.5 rounded-none shadow font-mono uppercase tracking-widest">
                    Fixed State
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-[10px] text-text-warm font-medium leading-relaxed">
              Has the issue been fixed to your satisfaction? Your confirmation locks resolution.
            </p>

            <div className="grid grid-cols-2 gap-2 font-mono uppercase text-[9px] tracking-widest">
              <button
                type="button"
                disabled={submittingConfirmation}
                onClick={() => handleConfirmation(true)}
                className="bg-verdigris-patina hover:bg-patina-pale text-lacquer-deep font-extrabold py-2 rounded-none flex items-center justify-center gap-1 cursor-pointer transition shadow"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Confirm Fixed
              </button>
              <button
                type="button"
                disabled={submittingConfirmation}
                onClick={() => handleConfirmation(false)}
                className="bg-vermilion-warning hover:bg-vermilion-warning-light text-champagne font-extrabold py-2 rounded-none flex items-center justify-center gap-1 cursor-pointer transition shadow"
              >
                <XCircle className="h-3.5 w-3.5" />
                Not Fixed
              </button>
            </div>
          </div>
        )}

        {/* Voting & General Actions Footer */}
        {report.status !== 'resolved_pending_confirmation' && (
          <div className="flex items-center justify-between border-t border-white/5 pt-3.5">
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-text-muted uppercase font-mono font-bold tracking-widest">Priority Score</span>
              <span className="text-champagne font-extrabold text-sm flex items-center gap-1 font-mono">
                🔥 {report.priority_score} {report.priority_score >= 25 ? 'votes' : 'votes'}
              </span>
            </div>

            {report.status !== 'resolved' && report.status !== 'rejected' && (
              <button
                type="button"
                onClick={handleVote}
                disabled={voting}
                className="bg-graphite hover:bg-graphite-2 active:scale-95 text-champagne border border-white/10 hover:border-kinpaku-gold/30 py-1.5 px-3 rounded-none text-xs font-bold font-mono uppercase tracking-widest transition flex items-center gap-1.5 cursor-pointer shadow"
              >
                <ThumbsUp className={`h-3.5 w-3.5 text-kinpaku-gold ${voting ? 'animate-bounce' : ''}`} />
                Upvote
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
