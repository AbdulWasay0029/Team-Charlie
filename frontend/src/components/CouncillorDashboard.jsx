import React, { useState, useEffect, useRef } from 'react';
import { LogOut, CheckCircle, AlertCircle, Clock, BarChart3, Image as ImageIcon, ClipboardCheck, ArrowRight, ShieldCheck, Calendar, MapPin, ExternalLink, X, Camera, Upload, Loader2, Sun, Moon } from 'lucide-react';
import { CATEGORIES } from '../mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export default function CouncillorDashboard({ councillor, onLogout, showToast, darkMode, toggleDarkMode, onOpenImage }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReports: 0,
    totalEscalated: 0,
    totalResolved: 0,
    totalPending: 0,
    avgResolutionTimeDays: 0
  });

  // Resolution Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [proofPhotoUrl, setProofPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);

  const fileInputRef = useRef(null);

  const fetchWardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch reports
      let allReports = [];
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/reports`);
        if (res.ok) {
          const data = await res.json();
          allReports = Array.isArray(data) ? data : [];
        }
      } else {
        // Fallback or Mock
        allReports = [];
      }

      // Helper function matching backend
      const getMockWard = (lat, lng) => {
        if (!lat || !lng) return "Ward 112 (Hitech City)";
        const wards = [
          "Ward 112 (Hitech City)",
          "Ward 95 (Khairatabad)",
          "Ward 80 (Charminar)",
          "Ward 101 (Jubilee Hills)",
          "Ward 120 (Kukatpally)",
          "Ward 85 (Koti)",
          "Ward 98 (Gachibowli)",
          "Ward 104 (Begumpet)"
        ];
        const index = Math.abs(Math.floor(lat * 1000 + lng * 1000)) % wards.length;
        return wards[index];
      };

      // Filter reports for this councillor's ward
      const wardReports = allReports.filter(r => getMockWard(r.lat, r.lng) === councillor.ward);
      
      // Sort escalated first, then by priority score desc
      const sorted = [...wardReports].sort((a, b) => {
        if (a.status === 'resolved' && b.status !== 'resolved') return 1;
        if (a.status !== 'resolved' && b.status === 'resolved') return -1;
        return (b.priority_score || 0) - (a.priority_score || 0);
      });

      setReports(sorted);

      // 2. Fetch stats
      if (API_BASE_URL) {
        const statsRes = await fetch(`${API_BASE_URL}/wards/${encodeURIComponent(councillor.ward)}/stats`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } else {
        // Compute stats locally
        const total = wardReports.length;
        const resolved = wardReports.filter(r => r.status === 'resolved').length;
        const escalated = wardReports.filter(r => r.priority_score >= 25 && r.status !== 'resolved').length;
        const pending = wardReports.filter(r => r.status === 'live' && r.priority_score < 25).length;
        setStats({
          totalReports: total,
          totalResolved: resolved,
          totalEscalated: escalated,
          totalPending: pending,
          avgResolutionTimeDays: 0.5
        });
      }
    } catch (err) {
      console.error("Error loading councillor dashboard data:", err);
      showToast("Failed to refresh ward dashboard", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWardData();
  }, [councillor]);

  // Compress proof image to base64
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 400;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.6);
        setProofPhotoUrl(base64);
        setCompressing(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!proofPhotoUrl.trim()) {
      showToast("Please select or capture a proof photo first.", "info");
      return;
    }

    setSubmitting(true);
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/reports/${selectedReport.id}/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resolution_photo_url: proofPhotoUrl.trim(),
            resolved_by: councillor.id
          })
        });

        if (!res.ok) {
          throw new Error("Failed to submit resolution.");
        }

        showToast("Issue successfully marked as resolved!", "success");
        setSelectedReport(null);
        setProofPhotoUrl('');
        fetchWardData();
      } else {
        // Stateful Mock Update locally
        setReports(prev => prev.map(r => r.id === selectedReport.id ? {
          ...r,
          status: 'resolved',
          resolution_photo_url: proofPhotoUrl
        } : r));
        
        showToast("Resolution completed successfully (Mock Mode).", "success");
        setSelectedReport(null);
        setProofPhotoUrl('');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || "Error resolving issue.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Get SLA aging text and color in premium dark mode styles
  const getSLADuration = (createdAt) => {
    const createdDate = new Date(createdAt);
    const diffTime = Math.abs(new Date() - createdDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let color = 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30';
    if (diffDays >= 7) {
      color = 'text-rose-455 bg-rose-955/20 border-rose-900/40 animate-pulse';
    } else if (diffDays >= 3) {
      color = 'text-amber-450 bg-amber-955/20 border-amber-900/30';
    }
    
    return {
      text: `${diffDays} ${diffDays === 1 ? 'day' : 'days'} outstanding`,
      color
    };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-body pb-12">
      {/* Header Bar */}
      <header className="bg-slate-900/80 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-650 flex items-center justify-center font-black text-slate-950 font-display select-none">
              BP
            </div>
            <div className="text-left leading-tight">
              <h1 className="text-sm font-display font-black tracking-wider uppercase text-slate-100">Zonal Command Room</h1>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">{councillor.ward}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-200">Welcome, {councillor.name}</p>
              <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider block font-bold mt-0.5">Ward Councillor Account</span>
            </div>
            <button 
              onClick={toggleDarkMode}
              className="bg-slate-800 border border-slate-700 text-slate-350 p-2 rounded-xl hover:bg-slate-700 hover:text-white transition cursor-pointer flex items-center justify-center shadow-sm"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="h-4 w-4 text-orange-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 space-y-6 text-left">
        {/* Ward Overview Aggregations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-xl flex items-center gap-4">
            <div className="p-3 bg-slate-950 text-slate-400 rounded-xl border border-slate-800">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Total Reports</p>
              <h3 className="text-2xl font-black text-slate-100 font-mono mt-0.5">{stats.totalReports}</h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-xl flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/10">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Active Escalated</p>
              <h3 className="text-2xl font-black text-orange-400 font-mono mt-0.5">{stats.totalEscalated}</h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-xl flex items-center gap-4">
            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/10">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Resolved SLA</p>
              <h3 className="text-2xl font-black text-teal-400 font-mono mt-0.5">{stats.totalResolved}</h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-xl flex items-center gap-4">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/10">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Avg Resolution</p>
              <h3 className="text-2xl font-black text-sky-400 font-mono mt-0.5">
                {stats.avgResolutionTimeDays} {stats.avgResolutionTimeDays === 1 ? 'day' : 'days'}
              </h3>
            </div>
          </div>
        </div>

        {/* Complaints Section */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-5">
            <div>
              <h2 className="text-base font-display font-extrabold text-slate-200">Grievance Escalation Registry</h2>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">Pending municipal intervention and resolution proof uploads</p>
            </div>
            <button
              onClick={fetchWardData}
              className="text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
            >
              Sync Registry
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
              <p className="text-slate-400 text-xs font-mono">Synchronizing Ward Complaint Database...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <span className="text-4xl">🏝️</span>
              <h3 className="text-sm font-bold text-slate-300">All Clear! No grievances escalated.</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">Either no complaints have been reported, or none have crossed the SLA priority score threshold yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => {
                const cat = CATEGORIES[report.category] || { label: report.category, icon: '📍' };
                const isResolved = report.status === 'resolved';
                const sla = getSLADuration(report.created_at);

                return (
                  <div key={report.id} className={`bg-slate-955 border rounded-2xl overflow-hidden shadow-md flex flex-col h-[400px] transition-all hover:border-slate-700/80 ${
                    isResolved ? 'border-teal-950/60 opacity-80' : 'border-slate-800/80'
                  }`}>
                    {/* Image Header */}
                    <div 
                      onClick={() => onOpenImage && onOpenImage({
                        imageUrl: report.photo_url,
                        category: cat.label,
                        description: report.description,
                        ward: report.ward,
                        status: report.status,
                        reporterName: report.reporter_name || 'Verified Citizen',
                        priorityScore: report.priority_score
                      })}
                      className="relative h-44 bg-slate-900 shrink-0 cursor-pointer group"
                    >
                      <img 
                        src={report.photo_url} 
                        alt={cat.label} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1599740831464-54c86b24d775?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                      
                      {/* Hover zoom hint */}
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-mono text-xs font-bold gap-1.5 backdrop-blur-xs z-20">
                        <ImageIcon className="w-4 h-4 text-orange-400" />
                        <span>Click to Expand</span>
                      </div>

                      {/* Top status badges */}
                      <div className="absolute top-2 left-2 flex gap-1 items-center z-10">
                        {isResolved ? (
                          <span className="bg-teal-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider border border-teal-400/20">Resolved</span>
                        ) : (
                          <span className="bg-orange-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider border border-orange-400/20 animate-pulse">Escalated</span>
                        )}
                        <span className="bg-slate-900/80 backdrop-blur-xs text-slate-200 border border-slate-700/50 text-[8px] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                          Severity {report.ai_severity || 1}/10
                        </span>
                      </div>

                      {/* Bottom Category Overlay */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-3 pt-6 flex items-end justify-between z-10">
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg bg-slate-900/70 p-1 rounded-xl border border-white/5">{cat.icon}</span>
                          <div className="text-left">
                            <h4 className="text-xs font-black text-slate-100 uppercase tracking-tight">{cat.label}</h4>
                            <p className="text-[8px] text-slate-400 font-mono mt-0.5">PRIORITY RATING: {report.priority_score || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Details Container */}
                    <div className="p-4 flex flex-col flex-1 min-h-0 justify-between">
                      <div className="space-y-3 min-h-0 overflow-y-auto">
                        <p className="text-xs text-slate-450 leading-relaxed text-left font-medium">
                          {report.description || "Civic hazard reported nearby. Verified by AI. Councillor resolution required."}
                        </p>

                        {/* Location GPS */}
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 bg-slate-900/50 p-2 rounded-xl border border-slate-800/40">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">Lat {report.lat ? report.lat.toFixed(5) : '0'}, Lng {report.lng ? report.lng.toFixed(5) : '0'}</span>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${report.lat},${report.lng}`} 
                            target="_blank" 
                            rel="_blank" 
                            className="ml-auto text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 font-bold"
                          >
                            Map <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>

                        {/* Reporter Info */}
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 pt-1">
                          <span className="text-teal-400 font-bold">👤</span>
                          <span className="font-semibold">Reported by: <strong className="text-slate-300">{report.reporter_name || 'Verified Citizen'}</strong></span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="border-t border-slate-900 pt-3 mt-2 flex items-center justify-between shrink-0">
                        {isResolved ? (
                          <div className="flex flex-col text-left">
                            <span className="text-[8px] text-slate-500 uppercase font-mono tracking-wider">Proof of Work</span>
                            <button
                              type="button"
                              onClick={() => onOpenImage && onOpenImage({
                                imageUrl: report.resolution_photo_url,
                                category: `${cat.label} (Resolution Proof)`,
                                description: "Resolved by Municipal Ward Operations Team.",
                                ward: report.ward,
                                status: 'resolved',
                                reporterName: `Zonal Officer (${councillor.name})`
                              })}
                              className="text-[10px] text-teal-400 font-bold hover:underline flex items-center gap-1 mt-0.5 font-mono uppercase cursor-pointer"
                            >
                              <ImageIcon className="w-3 h-3" /> View Proof
                            </button>
                          </div>
                        ) : (
                          <div className={`border rounded-lg py-0.5 px-2 text-[9px] font-mono font-bold uppercase tracking-wider ${sla.color}`}>
                            {sla.text}
                          </div>
                        )}

                        {isResolved ? (
                          <div className="flex items-center gap-1 text-teal-400 text-xs font-mono font-bold uppercase tracking-wider">
                            <span>SLA Met</span>
                            <CheckCircle className="w-4.5 h-4.5 text-teal-400" />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedReport(report)}
                            className="bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-mono font-extrabold text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-xl transition-all hover:scale-105 flex items-center gap-1.5 cursor-pointer shadow-sm animate-pulse"
                          >
                            <span>Lodge Proof</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Resolution Proof Upload Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-left">
            <button 
              onClick={() => { setSelectedReport(null); setProofPhotoUrl(''); }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1.5 rounded-full hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/15 shrink-0">
                <ClipboardCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-display font-extrabold text-slate-100 leading-none">Upload Resolution Proof</h3>
                <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-1.5">SLA Closed Loop Workflow</p>
              </div>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4 font-sans">
              <div className="space-y-2">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  Select Evidence Proof Image
                </label>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {compressing ? (
                  <div className="w-full border border-emerald-500/15 bg-slate-950 rounded-xl p-8 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-450" />
                    <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-widest">Compressing Image...</span>
                  </div>
                ) : !proofPhotoUrl ? (
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="w-full border border-dashed border-slate-800 hover:border-emerald-500/20 bg-slate-950 hover:bg-slate-950/80 transition rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer text-slate-400 shadow-inner"
                  >
                    <div className="bg-slate-900 p-2.5 rounded-xl text-emerald-400 border border-slate-800 shadow-sm">
                      <Camera className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-350">Camera / Gallery Upload</span>
                    <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Compresses file automatically</span>
                  </button>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video group">
                    <img
                      src={proofPhotoUrl}
                      alt="Proof Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setProofPhotoUrl('')}
                      className="absolute top-2 right-2 bg-slate-950/80 hover:bg-slate-950 text-white p-1 rounded-full cursor-pointer transition shadow-md border border-slate-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Dummy Image Presets for Hackathon Demo */}
              <div className="space-y-1.5">
                <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-600">Quick Presets (Demo)</span>
                <div className="grid grid-cols-2 gap-2 text-[8px] font-mono font-bold text-slate-400 uppercase">
                  <button
                    type="button"
                    onClick={() => setProofPhotoUrl('https://images.unsplash.com/photo-1599740831464-54c86b24d775')}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left cursor-pointer transition truncate"
                  >
                    🛠️ Pothole Fixed
                  </button>
                  <button
                    type="button"
                    onClick={() => setProofPhotoUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe')}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left cursor-pointer transition truncate"
                  >
                    💡 Streetlight Lit
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || compressing}
                className="w-full py-2.5 px-4 rounded-xl font-mono font-extrabold text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/15 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 mt-1 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Resolving Issue...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Resolution</span>
                    <CheckCircle className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
