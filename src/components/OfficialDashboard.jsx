import React, { useState } from 'react';
import { CATEGORIES } from '../mockData';
import { AlertCircle, Clock, CheckCircle2, MessageSquareCode, ArrowDownWideNarrow, BarChart3, PieChart } from 'lucide-react';

export default function OfficialDashboard({ reports, onUpdateStatus, onClose }) {
  const [activeQueueFilter, setActiveQueueFilter] = useState('all'); // 'all', 'in_progress', 'escalated'
  const [resolvingTicketId, setResolvingTicketId] = useState(null);
  const [resolutionPhoto, setResolutionPhoto] = useState('');

  // 1. Calculate Statistics
  const totalReports = reports.length;
  const inProgressReports = reports.filter(r => r.status === 'in_progress').length;
  const resolvedReports = reports.filter(r => r.status === 'resolved' || r.status === 'resolved_pending_confirmation').length;
  const escalatedReports = reports.filter(r => r.priority_score >= 25 && r.status !== 'resolved').length;

  // 2. SLA Clock details
  const getSLADetails = (report) => {
    const createdTime = new Date(report.created_at).getTime();
    const now = Date.now();
    let limitHours = 72; // Low severity default
    
    if (report.ai_severity === 'critical') limitHours = 4;
    else if (report.ai_severity === 'high') limitHours = 24;
    else if (report.ai_severity === 'medium') limitHours = 48;

    const limitMs = limitHours * 60 * 60 * 1000;
    const deadline = createdTime + limitMs;
    const timeLeftMs = deadline - now;
    const isOverdue = timeLeftMs < 0;

    const absDiff = Math.abs(timeLeftMs);
    const diffHours = Math.floor(absDiff / (1000 * 60 * 60));
    const diffMins = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (isOverdue) {
      return {
        label: `SLA Overdue: -${diffHours}h ${diffMins}m`,
        color: 'text-vermilion-warning bg-vermilion-warning/10 border-vermilion-warning/30'
      };
    } else {
      return {
        label: `SLA Clock: ${diffHours}h ${diffMins}m left`,
        color: 'text-verdigris-patina bg-verdigris-patina/10 border-verdigris-patina/30'
      };
    }
  };

  // 3. Category distribution (SVG chart calculation)
  const categoryCounts = reports.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});

  const totalCategoryPoints = Object.values(categoryCounts).reduce((a, b) => a + b, 0) || 1;

  // 4. Ward distribution (SVG bar chart calculation)
  const wardCounts = reports.reduce((acc, r) => {
    const wardName = r.ward?.split(' (')[0] || "General";
    acc[wardName] = (acc[wardName] || 0) + 1;
    return acc;
  }, {});

  // Sort and filter queue
  const queueReports = reports.filter(r => {
    if (r.status === 'resolved' || r.status === 'rejected') return false;
    if (activeQueueFilter === 'in_progress') return r.status === 'in_progress';
    if (activeQueueFilter === 'escalated') return r.priority_score >= 25;
    return true;
  }).sort((a, b) => b.priority_score - a.priority_score);

  const handleStartFixing = (reportId) => {
    onUpdateStatus(reportId, 'in_progress', null);
  };

  const handleSubmitResolution = (e, reportId) => {
    e.preventDefault();
    const photoUrl = resolutionPhoto || "https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&w=600&q=80"; // clean street
    onUpdateStatus(reportId, 'resolved_pending_confirmation', photoUrl);
    setResolvingTicketId(null);
    setResolutionPhoto('');
  };

  return (
    <div className="absolute inset-0 bg-lacquer-black z-[2500] flex flex-col overflow-hidden text-text-warm font-body">
      
      {/* Dashboard Top Header (Urushi / Kinpaku style) */}
      <div className="bg-lacquer-deep border-b border-kinpaku-gold px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-kinpaku-gold w-9 h-9 rounded-none flex items-center justify-center text-lacquer-deep shadow-md font-display font-black text-xl select-none">
            GP
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-display font-light tracking-wide uppercase text-champagne flex items-center gap-2">
              Official Resolution Dashboard
              <span className="bg-kinpaku-gold/15 text-kinpaku-gold text-[9px] px-2 py-0.5 rounded-none border border-kinpaku-gold/30 font-mono tracking-widest font-bold uppercase">
                Internal Portal
              </span>
            </h1>
            <p className="text-text-muted text-[10px] font-mono tracking-widest uppercase mt-0.5">Greater Hyderabad Municipal Corporation (GHMC)</p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="bg-graphite hover:bg-graphite-2 text-champagne font-extrabold text-[10px] font-mono tracking-widest uppercase py-2 px-4 rounded-none border border-white/5 transition cursor-pointer"
        >
          Exit Portal
        </button>
      </div>

      {/* Main Dashboard Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-lacquer-black">
        
        {/* LEFT COLUMN: Summary Statistics & SVG Charts */}
        <div className="w-full md:w-96 border-r border-white/5 p-5 overflow-y-auto space-y-6 shrink-0 bg-lacquer-deep/40">
          
          {/* Section: Metrics */}
          <div className="space-y-3.5">
            <h3 className="text-text-muted text-[9px] font-mono font-extrabold uppercase tracking-widest text-left">
              Key SLA KPI Metrics
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-raised-lacquer border border-white/5 p-3 rounded-none text-left">
                <span className="text-[9px] text-text-muted block font-mono font-bold uppercase tracking-wider">Total Issues</span>
                <span className="text-2xl font-black font-mono text-champagne">{totalReports}</span>
              </div>
              <div className="bg-raised-lacquer border border-white/5 p-3 rounded-none text-left">
                <span className="text-[9px] text-blue-400 block font-mono font-bold uppercase tracking-wider">In Progress</span>
                <span className="text-2xl font-black font-mono text-blue-400">{inProgressReports}</span>
              </div>
              <div className="bg-raised-lacquer border border-white/5 p-3 rounded-none text-left">
                <span className="text-[9px] text-verdigris-patina block font-mono font-bold uppercase tracking-wider">Resolved</span>
                <span className="text-2xl font-black font-mono text-verdigris-patina">{resolvedReports}</span>
              </div>
              
              {/* WhatsApp Alert Badge */}
              <div className="bg-raised-lacquer border border-white/5 p-3 rounded-none text-left relative overflow-hidden group">
                <span className="text-[9px] text-vermilion-warning block font-mono font-bold uppercase tracking-wider">WhatsApp Alert</span>
                <span className="text-2xl font-black font-mono text-vermilion-warning flex items-center gap-1">
                  {escalatedReports}
                </span>
                <div className="absolute top-2 right-2 bg-vermilion-warning/10 p-1 rounded-none text-vermilion-warning border border-vermilion-warning/15">
                  <MessageSquareCode className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Category Stats */}
          <div className="bg-raised-lacquer border border-white/5 rounded-none p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-champagne text-xs font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
                <PieChart className="h-4 w-4 text-kinpaku-gold" />
                Category Breakdown
              </h3>
              <span className="text-[8px] font-mono tracking-widest uppercase bg-lacquer-deep text-text-muted font-bold px-2 py-0.5 rounded-none border border-white/5">
                Tickets
              </span>
            </div>
            
            <div className="space-y-3">
              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const count = categoryCounts[key] || 0;
                const percentage = Math.round((count / totalCategoryPoints) * 100);
                if (count === 0) return null;
                return (
                  <div key={key} className="space-y-1.5 text-left font-mono">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="flex items-center gap-1 text-champagne">
                        <span>{cat.icon}</span>
                        <span className="uppercase tracking-wide">{cat.label}</span>
                      </span>
                      <span className="text-text-muted">{count} ({percentage}%)</span>
                    </div>
                    {/* Visual Bar progress */}
                    <div className="w-full h-1.5 bg-lacquer-deep rounded-none overflow-hidden border border-white/5">
                      <div 
                        className={`h-full bg-kinpaku-gold`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Area distribution */}
          <div className="bg-raised-lacquer border border-white/5 rounded-none p-4 space-y-4">
            <h3 className="text-champagne text-xs font-bold uppercase tracking-widest font-mono flex items-center gap-1.5 text-left">
              <BarChart3 className="h-4 w-4 text-verdigris-patina" />
              Ward Distribution
            </h3>
            
            <div className="space-y-3.5 pt-1">
              {Object.entries(wardCounts).map(([ward, count]) => {
                const maxCount = Math.max(...Object.values(wardCounts));
                const barWidth = (count / maxCount) * 100;
                return (
                  <div key={ward} className="space-y-1 text-left font-mono">
                    <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider">
                      <span>{ward}</span>
                      <span className="text-champagne">{count} tickets</span>
                    </div>
                    <div className="w-full h-2 bg-lacquer-deep rounded-none overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-verdigris-patina to-blue-500" 
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Priority Queue List */}
        <div className="flex-1 flex flex-col overflow-hidden p-5 space-y-4">
          
          {/* Queue Title & Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-left">
              <ArrowDownWideNarrow className="h-5 w-5 text-kinpaku-gold" />
              <div>
                <h2 className="text-2xl font-display font-light uppercase tracking-wide text-champagne">Priority Complaint Queue</h2>
                <p className="text-[9px] text-text-muted font-mono font-bold uppercase tracking-wider">Tickets are automatically sorted by community upvotes weight</p>
              </div>
            </div>

            {/* Queue Filter Tabs (Neo Kinpaku Outline buttons) */}
            <div className="flex bg-lacquer-deep border border-white/5 p-1 rounded-none font-mono uppercase text-[9px] tracking-widest">
              <button
                onClick={() => setActiveQueueFilter('all')}
                className={`py-1.5 px-3 rounded-none font-semibold cursor-pointer transition ${
                  activeQueueFilter === 'all'
                    ? 'bg-kinpaku-gold text-lacquer-deep'
                    : 'text-text-muted hover:text-champagne'
                }`}
              >
                All Active ({reports.filter(r => r.status !== 'resolved').length})
              </button>
              <button
                onClick={() => setActiveQueueFilter('in_progress')}
                className={`py-1.5 px-3 rounded-none font-semibold cursor-pointer transition ${
                  activeQueueFilter === 'in_progress'
                    ? 'bg-kinpaku-gold text-lacquer-deep'
                    : 'text-text-muted hover:text-champagne'
                }`}
              >
                In Progress ({inProgressReports})
              </button>
              <button
                onClick={() => setActiveQueueFilter('escalated')}
                className={`py-1.5 px-3 rounded-none font-semibold cursor-pointer transition ${
                  activeQueueFilter === 'escalated'
                    ? 'bg-vermilion-warning/20 border border-vermilion-warning/30 text-vermilion-warning'
                    : 'text-text-muted hover:text-champagne'
                }`}
              >
                🔥 Escalated ({escalatedReports})
              </button>
            </div>
          </div>

          {/* Ticket List Queue */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
            {queueReports.length === 0 ? (
              <div className="text-center py-20 bg-raised-lacquer border border-white/5 rounded-none p-6 text-text-muted">
                <Clock className="h-10 w-10 text-graphite mx-auto mb-2.5" />
                <p className="text-sm font-bold font-mono uppercase tracking-widest">No issues in this queue.</p>
                <p className="text-xs text-text-faint mt-1.5">Excellent work! All civic complaints are resolved.</p>
              </div>
            ) : (
              queueReports.map((report) => {
                const sla = getSLADetails(report);
                const cat = CATEGORIES[report.category] || { label: report.category, icon: '📍' };
                const isEscalated = report.priority_score >= 25;

                return (
                  <div 
                    key={report.id}
                    className={`bg-raised-lacquer border rounded-none p-4 flex flex-col lg:flex-row gap-4 text-left transition hover:border-white/10 ${
                      isEscalated 
                        ? 'border-vermilion-warning/20 bg-vermilion-warning/5' 
                        : 'border-white/5'
                    }`}
                  >
                    {/* Photo Thumbnail */}
                    <div className="w-full lg:w-44 h-32 rounded-none overflow-hidden bg-lacquer-deep shrink-0 relative border border-white/5">
                      <img 
                        src={report.photo_url} 
                        alt={cat.label} 
                        className="w-full h-full object-cover"
                      />
                      {isEscalated && (
                        <div className="absolute top-2 left-2 bg-vermilion-warning text-champagne font-extrabold text-[8px] px-1.5 py-0.5 rounded-none shadow font-mono uppercase tracking-widest animate-pulse">
                          <AlertCircle className="h-3 w-3" />
                          ESCALATED
                        </div>
                      )}
                    </div>

                    {/* Report Metadata */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{cat.icon}</span>
                          <div>
                            <h3 className="font-display font-light text-xl text-champagne leading-none uppercase tracking-wide">{cat.label}</h3>
                            <span className="text-[9px] text-text-muted font-mono tracking-wider">{report.ward}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 font-mono text-[8px] uppercase tracking-widest">
                          <span className={`px-2 py-0.5 rounded-none border font-bold ${sla.color}`}>
                            {sla.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-none font-black uppercase tracking-wider ${
                            report.ai_severity === 'critical' ? 'bg-vermilion-warning/20 text-vermilion-warning border border-vermilion-warning/30' :
                            report.ai_severity === 'high' ? 'bg-vermilion-warning/10 text-vermilion-warning border border-vermilion-warning/20' :
                            'bg-graphite text-text-muted border border-white/5'
                          }`}>
                            Severity {report.ai_severity}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-text-warm font-medium leading-relaxed max-w-2xl">
                        {report.description}
                      </p>

                      {/* AI vision diagnostics */}
                      <div className="text-[9px] bg-lacquer-deep p-2.5 rounded-none border border-white/5 grid grid-cols-2 lg:grid-cols-3 gap-2 font-mono uppercase tracking-wider">
                        <div>
                          <span className="text-text-muted block font-semibold text-[8px]">Detected Issue</span>
                          <span className="text-champagne font-bold">{report.ai_issue_type || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-text-muted block font-semibold text-[8px]">Verification</span>
                          <span className="text-verdigris-patina font-bold">✅ AI Verified</span>
                        </div>
                        <div className="col-span-2 lg:col-span-1">
                          <span className="text-text-muted block font-semibold text-[8px]">Priority Weight</span>
                          <span className="text-kinpaku-gold font-bold">🔥 {report.priority_score} Upvotes</span>
                        </div>
                      </div>
                    </div>

                    {/* Resolution Operations Block */}
                    <div className="w-full lg:w-48 shrink-0 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-4 space-y-2 font-mono uppercase text-[9px] tracking-widest">
                      
                      {report.status !== 'in_progress' && report.status !== 'resolved_pending_confirmation' && (
                        <button
                          type="button"
                          onClick={() => handleStartFixing(report.id)}
                          className="w-full bg-kinpaku-gold hover:bg-kinpaku-pale text-lacquer-deep font-extrabold py-2 rounded-none flex items-center justify-center gap-1.5 cursor-pointer shadow transition"
                        >
                          <Clock className="h-4 w-4" />
                          Acknowledge
                        </button>
                      )}

                      {report.status === 'in_progress' && resolvingTicketId !== report.id && (
                        <button
                          type="button"
                          onClick={() => setResolvingTicketId(report.id)}
                          className="w-full bg-verdigris-patina hover:bg-patina-pale text-lacquer-deep font-extrabold py-2 rounded-none flex items-center justify-center gap-1.5 cursor-pointer shadow transition"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Resolve
                        </button>
                      )}

                      {/* Expanding photo resolution input */}
                      {resolvingTicketId === report.id && (
                        <form onSubmit={(e) => handleSubmitResolution(e, report.id)} className="space-y-2 text-left font-mono">
                          <span className="text-[8px] text-kinpaku-gold font-extrabold uppercase tracking-widest block">Resolution Photo Link</span>
                          <input
                            type="url"
                            required
                            value={resolutionPhoto}
                            onChange={(e) => setResolutionPhoto(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full bg-lacquer-deep border border-white/10 text-champagne rounded-none py-1.5 px-2 text-[9px] placeholder:text-slate-800 focus:outline-none"
                          />
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="submit"
                              className="bg-verdigris-patina hover:bg-patina-pale text-lacquer-deep font-extrabold text-[8px] py-1 rounded-none cursor-pointer text-center"
                            >
                              Submit
                            </button>
                            <button
                              type="button"
                              onClick={() => { setResolvingTicketId(null); setResolutionPhoto(''); }}
                              className="bg-graphite text-text-muted hover:text-champagne text-[8px] py-1 rounded-none cursor-pointer text-center"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Display current status banner */}
                      {report.status === 'resolved_pending_confirmation' && (
                        <div className="bg-verdigris-patina/10 border border-verdigris-patina/20 text-verdigris-patina text-[9px] font-bold p-2.5 rounded-none text-center flex items-center justify-center gap-1 animate-pulse">
                          <span>⏳ Awaiting Citizen Conf.</span>
                        </div>
                      )}

                      {report.status === 'in_progress' && (
                        <div className="text-[9px] text-blue-400 text-center font-bold tracking-widest uppercase">
                          ⚙️ Dispatch Active
                        </div>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
