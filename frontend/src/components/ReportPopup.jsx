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
        return <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[9px] px-2.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider">Verification Pending</span>;
      case 'live':
        return <span className="bg-orange-500/10 text-orange-600 border border-orange-200/60 text-[9px] px-2.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider animate-pulse">Live</span>;
      case 'in_progress':
        return <span className="bg-blue-500/10 text-blue-605 border border-blue-200/60 text-[9px] px-2.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider">In Progress</span>;
      case 'resolved_pending_confirmation':
        return <span className="bg-teal-600 text-white text-[9px] px-2.5 py-0.5 rounded-full font-black font-mono uppercase tracking-widest animate-pulse shadow-sm shadow-teal-500/10">Needs Citizen Action</span>;
      case 'resolved':
        return <span className="bg-teal-500/10 text-teal-650 border border-teal-200/60 text-[9px] px-2.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider">Resolved</span>;
      case 'reopened':
        return <span className="bg-red-550 text-white border border-red-600 text-[9px] px-2.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 animate-bounce">🚨 Reopened</span>;
      case 'rejected':
        return <span className="bg-slate-100 text-slate-400 border border-slate-200 text-[9px] px-2.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider">Rejected</span>;
      default:
        return <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[9px] px-2.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider">{status}</span>;
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <span className="bg-red-100 text-red-700 border border-red-200 text-[8px] px-2 py-0.5 rounded-full font-extrabold uppercase font-mono tracking-wider">Critical</span>;
      case 'high':
        return <span className="bg-orange-100 text-orange-700 border border-orange-200 text-[8px] px-2 py-0.5 rounded-full font-extrabold uppercase font-mono tracking-wider">High</span>;
      case 'medium':
        return <span className="bg-yellow-100 text-yellow-700 border border-yellow-250 text-[8px] px-2 py-0.5 rounded-full font-extrabold uppercase font-mono tracking-wider">Medium</span>;
      case 'low':
        return <span className="bg-slate-100 text-slate-650 border border-slate-200 text-[8px] px-2 py-0.5 rounded-full font-extrabold uppercase font-mono tracking-wider">Low</span>;
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
    <div className="w-80 flex flex-col max-h-[480px] text-slate-800 font-body bg-white rounded-2xl overflow-hidden shadow-xl">
      {/* Photo Header */}
      <div className="relative h-40 w-full overflow-hidden bg-slate-100">
        <img 
          src={report.photo_url} 
          alt={categoryInfo.label} 
          className="w-full h-full object-cover"
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
        <p className="text-xs text-slate-655 leading-relaxed text-left font-medium">
          {report.description}
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
            <span className="text-slate-400 uppercase font-bold tracking-wider">Verification</span>
            <span className="text-slate-700 flex items-center gap-1 mt-0.5 font-bold">
              {report.ai_verified ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                  <span className="text-teal-650 font-extrabold uppercase">AI Verified</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-3.5 w-3.5 text-orange-655" />
                  <span className="text-orange-600 font-extrabold uppercase">Unverified</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* CITIZEN ACCOUNTABILITY LOOP */}
        {report.status === 'resolved_pending_confirmation' && (
          <div className="border border-teal-555/20 bg-teal-500/5 rounded-xl p-3 space-y-3 text-left">
            <div className="flex items-center gap-1.5 text-teal-650 text-xs font-black uppercase font-mono tracking-widest">
              <AlertTriangle className="h-4 w-4 text-teal-600" />
              <span>Citizen Action Required</span>
            </div>
            
            {report.resolution_photo_url && (
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 font-mono font-bold tracking-widest block uppercase">Resolution Evidence:</span>
                <div className="h-24 w-full rounded-xl overflow-hidden border border-slate-200 relative">
                  <img 
                    src={report.resolution_photo_url} 
                    alt="Resolution Evidence" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 right-1 bg-teal-600 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full shadow font-mono uppercase tracking-widest">
                    Fixed State
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
              Has the issue been fixed to your satisfaction? Your confirmation locks resolution.
            </p>

            <div className="grid grid-cols-2 gap-2 font-mono uppercase text-[9px] tracking-widest">
              <button
                type="button"
                disabled={submittingConfirmation}
                onClick={() => handleConfirmation(true)}
                className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition shadow"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Confirm Fixed
              </button>
              <button
                type="button"
                disabled={submittingConfirmation}
                onClick={() => handleConfirmation(false)}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-extrabold py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition shadow"
              >
                <XCircle className="h-3.5 w-3.5" />
                Not Fixed
              </button>
            </div>
          </div>
        )}

        {/* Voting & Actions */}
        {report.status !== 'resolved_pending_confirmation' && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-3.5">
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-slate-400 uppercase font-mono font-bold tracking-widest">Priority Score</span>
              <span className="text-slate-800 font-extrabold text-sm flex items-center gap-1 font-mono">
                🔥 {report.priority_score} {report.priority_score >= 25 ? 'votes' : 'votes'}
              </span>
            </div>

            {report.status !== 'resolved' && report.status !== 'rejected' && (
              <button
                type="button"
                onClick={handleVote}
                disabled={voting}
                className="bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 hover:border-orange-500/30 py-1.5 px-3 rounded-xl text-xs font-bold font-mono uppercase tracking-widest transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <ThumbsUp className={`h-3.5 w-3.5 text-orange-500 ${voting ? 'animate-bounce' : ''}`} />
                Upvote
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
