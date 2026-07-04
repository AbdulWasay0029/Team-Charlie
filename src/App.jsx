import React, { useState, useEffect } from 'react';
import MapView from './components/MapView';
import FilterBar from './components/FilterBar';
import ReportForm from './components/ReportForm';
import SidePanel from './components/SidePanel';
import OfficialDashboard from './components/OfficialDashboard';
import AuthModal from './components/AuthModal';
import { INITIAL_REPORTS, CATEGORIES } from './mockData';
import { 
  AlertCircle, CheckCircle2, Info, RefreshCw, X, Shield, 
  Map, Award, Flame, User, LogOut, MessageSquare, AlertOctagon 
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const IS_MOCK_MODE = !API_BASE_URL;

// Helper to determine ward name from coordinates
const getMockWard = (lat, lng) => {
  const wards = [
    "Ward 112 (Hitech City)",
    "Ward 95 (Khairatabad)",
    "Ward 80 (Charminar)",
    "Ward 101 (Jubilee Hills)",
    "Ward 120 (Kukatpally)",
    "Ward 85 (Koti)",
    "Ward 98 (Gachibowli)",
    "Ward 115 (Madhapur)"
  ];
  const index = Math.abs(Math.floor(lat * 1000 + lng * 1000)) % wards.length;
  return wards[index];
};

export default function App() {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ category: 'all', status: 'all' });
  const [sortBy, setSortBy] = useState('priority');
  
  // Modals & Panels State
  const [activeClick, setActiveClick] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOfficialDashboardOpen, setIsOfficialDashboardOpen] = useState(false);
  const [showIntroPitch, setShowIntroPitch] = useState(true);
  
  // Interactive Overlays
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [escalationAlert, setEscalationAlert] = useState(null); // holds report details when 25 votes hit
  const [currentUser, setCurrentUser] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast notifier helper
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Synchronize or load reports
  const fetchReports = async (showNotification = false) => {
    setIsPolling(true);
    try {
      if (IS_MOCK_MODE) {
        setReports(prev => {
          if (prev.length === 0) return INITIAL_REPORTS;
          return prev;
        });
        if (showNotification) showToast("Mock data refreshed successfully", "success");
      } else {
        const url = new URL(`${API_BASE_URL}/reports`);
        url.searchParams.append('sort', sortBy === 'newest' ? 'date' : 'priority');
        if (filters.status !== 'all') url.searchParams.append('status', filters.status);
        if (filters.category !== 'all') url.searchParams.append('category', filters.category);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Failed to fetch reports");
        const data = await res.json();
        setReports(data);
        if (showNotification) showToast("Live reports synchronized", "success");
      }
    } catch (err) {
      console.error(err);
      showToast(`Network Sync Failed: ${err.message}`, "error");
    } finally {
      setIsPolling(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(() => {
      fetchReports(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [filters, sortBy]);

  // Handle map click
  const handleMapClick = (latlng) => {
    setActiveClick(latlng);
    setShowForm(true);
  };

  // Handle report submission
  const handleReportSubmit = async (formData) => {
    const newReportLocalId = Date.now();
    const mockCreatedReport = {
      id: newReportLocalId,
      user_id: currentUser ? currentUser.id : "usr_anonymous",
      lat: formData.lat,
      lng: formData.lng,
      category: formData.category,
      description: formData.description,
      photo_url: formData.photo_url,
      ai_verified: formData.ai_verified,
      ai_severity: formData.ai_severity,
      ai_issue_type: formData.ai_issue_type,
      status: 'pending', 
      priority_score: 1,
      ward: getMockWard(formData.lat, formData.lng),
      resolution_photo_url: null,
      created_at: new Date().toISOString()
    };

    setReports(prev => [mockCreatedReport, ...prev]);
    setShowForm(false);
    setActiveClick(null);
    showToast("Complaint submitted! Verification Pending on Map.", "info");

    try {
      if (IS_MOCK_MODE) {
        setTimeout(() => {
          setReports(prev => 
            prev.map(r => {
              if (r.id === newReportLocalId) {
                return {
                  ...r,
                  status: 'live',
                  priority_score: 1
                };
              }
              return r;
            })
          );
          showToast("AI Verification Approved: Ticket live on dashboard!", "success");
        }, 3500);

      } else {
        const res = await fetch(`${API_BASE_URL}/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: currentUser ? currentUser.id : 'usr_anonymous',
            lat: formData.lat,
            lng: formData.lng,
            category: formData.category,
            photo_url: formData.photo_url
          })
        });

        if (!res.ok) throw new Error("Server rejected report submission");
        const resData = await res.json();
        
        setReports(prev =>
          prev.map(r => (r.id === newReportLocalId ? { ...r, id: resData.id, status: resData.status || r.status } : r))
        );
        showToast("Backend registered complaint successfully", "success");
        fetchReports();
      }
    } catch (err) {
      console.error(err);
      showToast(`Submission failed: ${err.message}`, "error");
      setReports(prev => prev.filter(r => r.id !== newReportLocalId));
    }
  };

  // Upvote ticket
  const handleVote = async (reportId) => {
    try {
      let updatedReport = null;
      if (IS_MOCK_MODE) {
        setReports(prev =>
          prev.map(r => {
            if (r.id === reportId) {
              const newVotes = r.priority_score + 1;
              updatedReport = { ...r, priority_score: newVotes };
              
              if (newVotes === 25) {
                setEscalationAlert({
                  id: r.id,
                  category: r.category,
                  ward: r.ward,
                  priority_score: newVotes,
                  description: r.description
                });
              }
              return updatedReport;
            }
            return r;
          })
        );
        showToast("Upvoted! Priority score increased.", "success");
      } else {
        const res = await fetch(`${API_BASE_URL}/reports/${reportId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: currentUser ? currentUser.id : 'usr_anonymous' })
        });
        if (!res.ok) throw new Error("Failed to cast vote");
        const resData = await res.json();
        
        setReports(prev =>
          prev.map(r => {
            if (r.id === reportId) {
              const newVotes = resData.priority_score;
              updatedReport = { ...r, priority_score: newVotes };
              
              if (newVotes >= 25 && r.priority_score < 25) {
                setEscalationAlert({
                  id: r.id,
                  category: r.category,
                  ward: r.ward,
                  priority_score: newVotes,
                  description: r.description
                });
              }
              return updatedReport;
            }
            return r;
          })
        );
        showToast("Upvote registered on backend", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Could not register upvote", "error");
    }
  };

  // Citizen confirmation
  const handleConfirmResolution = async (reportId, confirmed) => {
    try {
      if (IS_MOCK_MODE) {
        setReports(prev =>
          prev.map(r => {
            if (r.id === reportId) {
              return {
                ...r,
                status: confirmed ? 'resolved' : 'reopened',
                priority_score: confirmed ? r.priority_score : r.priority_score + 10
              };
            }
            return r;
          })
        );
        if (confirmed) {
          showToast("Resolution confirmed! Thank you for verification.", "success");
        } else {
          showToast("Complaint reopened! Priority boosted for immediate GHMC review.", "error");
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/reports/${reportId}/confirm-resolution`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: currentUser ? currentUser.id : 'usr_anonymous', confirmed })
        });
        if (!res.ok) throw new Error("Failed to post resolution status");
        const updatedReport = await res.json();
        
        setReports(prev => (r.id === reportId ? updatedReport : r));
        showToast(confirmed ? "Confirmed fixed!" : "Report reopened on backend", "success");
      }
    } catch (err) {
      console.error(err);
      showToast(`Verification Failed: ${err.message}`, "error");
    }
  };

  // Official Status updating
  const handleUpdateStatus = (reportId, newStatus, resolutionPhotoUrl) => {
    setReports(prev =>
      prev.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            status: newStatus,
            resolution_photo_url: resolutionPhotoUrl || r.resolution_photo_url
          };
        }
        return r;
      })
    );
    showToast(`Status updated to ${newStatus.replace(/_/g, ' ')}`, "success");
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    showToast(`Logged in as ${user.name}`, "success");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast("Logged out successfully", "info");
  };

  const displayedReports = reports.filter(r => {
    const matchCategory = filters.category === 'all' || r.category === filters.category;
    const matchStatus = filters.status === 'all' || r.status === filters.status;
    return matchCategory && matchStatus;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else {
      return b.priority_score - a.priority_score;
    }
  });

  const getWhatsAppMessageText = (alert) => {
    const catLabel = CATEGORIES[alert.category]?.label || alert.category;
    return `🚨 *BHARAT PATROL URGENT CIVIC ESCALATION* 🚨

*Attention Ward Councillor, ${alert.ward}*

An infrastructure issue in your constituency has crossed the community threshold of 25+ votes:

*Issue*: ${catLabel}
*Details*: ${alert.description}
*Current Votes*: 🔥 ${alert.priority_score} verified citizens
*Status*: Pending action

This issue poses a public risk and requires immediate department dispatch. 

_This message was auto-escalated via Bharat Patrol (Twilio API) based on crowdsourced verification._`;
  };

  return (
    <div className="w-screen h-screen relative bg-lacquer-black flex flex-col select-none overflow-hidden font-body">
      
      {/* 1. TOP HEADER INDICATOR */}
      <div className="absolute top-24 right-4 z-[1000] flex flex-col gap-2 font-mono uppercase text-[9px] tracking-wider">
        {IS_MOCK_MODE ? (
          <div className="bg-raised-lacquer border border-kinpaku-gold/30 text-kinpaku-gold rounded-none py-1.5 px-3 font-bold shadow-xl flex items-center gap-1.5 backdrop-blur-sm">
            <Info className="h-3.5 w-3.5" />
            <span>MOCK DATABASE ACTIVE</span>
          </div>
        ) : (
          <div className="bg-raised-lacquer border border-verdigris-patina/30 text-verdigris-patina rounded-none py-1.5 px-3 font-bold shadow-xl flex items-center gap-1.5 backdrop-blur-sm">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>LIVE BACKEND SYNC</span>
          </div>
        )}
      </div>

      {/* 2. FLOATING CONTROL BUTTONS (RIGHT MIDDLE) - Impeccable Neo Kinpaku Styling */}
      <div className="absolute top-44 right-4 z-[1000] flex flex-col gap-3 font-mono uppercase tracking-widest text-[9px]">
        
        {/* Toggle Heatmap Overlay */}
        <button
          onClick={() => {
            setShowHeatmap(!showHeatmap);
            showToast(showHeatmap ? "Heatmap disabled" : "Heatmap density overlay enabled", "info");
          }}
          className={`p-3 rounded-none shadow-2xl border font-bold flex items-center justify-center gap-2 transition cursor-pointer backdrop-blur-md ${
            showHeatmap 
              ? 'bg-kinpaku-gold border-transparent text-lacquer-deep' 
              : 'bg-raised-lacquer border-white/10 text-champagne hover:border-kinpaku-gold/40'
          }`}
          title="Density Heatmap"
        >
          <Flame className={`h-5 w-5 ${showHeatmap ? 'animate-pulse text-lacquer-deep' : 'text-kinpaku-gold'}`} />
          <span className="hidden md:inline">Heatmap</span>
        </button>

        {/* Toggle Citizen SidePanel */}
        <button
          onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
          className="p-3 rounded-none shadow-2xl border border-white/10 bg-raised-lacquer text-champagne hover:border-kinpaku-gold/40 flex items-center justify-center gap-2 transition cursor-pointer backdrop-blur-md"
          title="Citizen Leaderboard"
        >
          <Award className="h-5 w-5 text-kinpaku-gold" />
          <span className="hidden md:inline">Leaderboard</span>
        </button>

        {/* Toggle Official Dashboard Portal */}
        <button
          onClick={() => {
            setIsOfficialDashboardOpen(true);
            showToast("Entering GHMC Resolution Panel", "info");
          }}
          className="p-3 rounded-none shadow-2xl border border-white/10 bg-raised-lacquer text-champagne hover:border-kinpaku-gold/40 flex items-center justify-center gap-2 transition cursor-pointer backdrop-blur-md"
          title="Official Portal"
        >
          <Shield className="h-5 w-5 text-verdigris-patina" />
          <span className="hidden md:inline">Official Portal</span>
        </button>

        {/* Auth Button */}
        {currentUser ? (
          <button
            onClick={handleLogout}
            className="p-3 rounded-none shadow-2xl border border-vermilion-warning/20 bg-raised-lacquer text-vermilion-warning hover:text-white hover:bg-vermilion-warning/15 flex items-center justify-center gap-2 transition cursor-pointer backdrop-blur-md"
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden md:inline-block max-w-[80px] truncate">{currentUser.name.split(' ')[0]}</span>
          </button>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="p-3 rounded-none shadow-2xl border border-kinpaku-gold bg-kinpaku-gold text-lacquer-deep font-bold flex items-center justify-center gap-2 transition cursor-pointer backdrop-blur-md"
            title="Log In"
          >
            <User className="h-5 w-5 text-lacquer-deep" />
            <span className="hidden md:inline">Log In</span>
          </button>
        )}
      </div>

      {/* 3. FILTER BAR */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onRefresh={() => fetchReports(true)}
        isPolling={isPolling}
      />

      {/* 4. MAP VIEW */}
      <div className="flex-1 w-full h-full">
        <MapView
          reports={displayedReports}
          activeClick={activeClick}
          onMapClick={handleMapClick}
          onVote={handleVote}
          onConfirmResolution={handleConfirmResolution}
          showHeatmap={showHeatmap}
        />
      </div>

      {/* 5. SLIDING PANEL (LEADERBOARD) */}
      <SidePanel
        isOpen={isSidePanelOpen}
        onClose={() => setIsSidePanelOpen(false)}
        reports={reports}
        currentUser={currentUser}
        onLoginClick={() => {
          setIsSidePanelOpen(false);
          setIsAuthModalOpen(true);
        }}
      />

      {/* 6. REPORT FORM MODAL */}
      {showForm && activeClick && (
        <ReportForm
          lat={activeClick.lat}
          lng={activeClick.lng}
          onSubmit={handleReportSubmit}
          onClose={() => {
            setShowForm(false);
            setActiveClick(null);
          }}
        />
      )}

      {/* 7. OFFICIAL RESOLUTION DASHBOARD */}
      {isOfficialDashboardOpen && (
        <OfficialDashboard
          reports={reports}
          onUpdateStatus={handleUpdateStatus}
          onClose={() => setIsOfficialDashboardOpen(false)}
        />
      )}

      {/* 8. PHONE OTP AUTH MODAL */}
      {isAuthModalOpen && (
        <AuthModal
          onLogin={handleLogin}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

      {/* 9. PITCH OPENING MODAL (ON FIRST LOAD) - Neo Kinpaku Theme */}
      {showIntroPitch && (
        <div className="fixed inset-0 bg-lacquer-deep/95 backdrop-blur-sm z-[5000] flex items-center justify-center p-4">
          <div className="bg-raised-lacquer border border-kinpaku-gold/30 w-full max-w-lg rounded-none shadow-2xl p-6 md:p-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-350">
            
            {/* Solid Gold Logo Tile */}
            <div className="flex justify-center">
              <div className="bg-kinpaku-gold w-16 h-16 rounded-none flex items-center justify-center text-lacquer-deep shadow-xl font-display font-black text-4xl select-none">
                BP
              </div>
            </div>

            <div className="space-y-1.5 text-center">
              <h1 className="text-3xl font-display font-light text-champagne tracking-widest leading-none uppercase">
                Bharat Patrol
              </h1>
              <p className="text-[10px] font-mono tracking-widest font-extrabold text-kinpaku-gold uppercase">
                India's First AI-Verified Infrastructure Accountability Portal
              </p>
            </div>

            {/* National Crisis Pitch statistics */}
            <div className="bg-lacquer-deep p-5 border border-white/5 rounded-none space-y-4">
              <p className="text-xs text-text-warm font-semibold leading-relaxed text-center font-body">
                "10,476 Indians died last year because of potholes. Not because we don't know where the potholes are — because nobody is accountable for fixing them. Bharat Patrol changes that."
              </p>
              
              <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-center">
                <div className="bg-raised-lacquer p-3 border border-vermilion-warning/20 rounded-none">
                  <span className="text-vermilion-warning font-extrabold text-xl block">10,476</span>
                  <span className="text-[9px] text-text-muted uppercase font-bold tracking-wider">Pothole Deaths/Yr</span>
                </div>
                <div className="bg-raised-lacquer p-3 border border-vermilion-warning/20 rounded-none">
                  <span className="text-vermilion-warning font-extrabold text-xl block">3.5L km</span>
                  <span className="text-[9px] text-text-muted uppercase font-bold tracking-wider">Damaged Roads</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 font-mono text-[10px] uppercase tracking-widest">
              <button
                onClick={() => setShowIntroPitch(false)}
                className="w-full bg-kinpaku-gold hover:bg-kinpaku-pale text-lacquer-deep font-extrabold py-4 px-6 rounded-none shadow-xl cursor-pointer transition text-xs"
              >
                Access Interactive Dashboard
              </button>
              <p className="text-[8px] text-text-faint font-semibold">
                Tap anywhere on the map to file a report. Click on hot-spots to upvote.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* 10. WHATSAPP ESCALATION ALERTS MODAL (TWILIO TWITTER DEMO EVENT) */}
      {escalationAlert && (
        <div className="fixed inset-0 bg-lacquer-deep/80 backdrop-blur-sm z-[4000] flex items-center justify-center p-4">
          <div className="bg-raised-lacquer border border-verdigris-patina/20 w-full max-w-sm rounded-none shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* WhatsApp Styled Header using Patina Theme */}
            <div className="bg-verdigris-patina p-4 text-lacquer-deep flex items-center gap-3">
              <div className="bg-lacquer-deep/20 p-2 rounded-none">
                <MessageSquare className="h-5 w-5 text-lacquer-deep" />
              </div>
              <div className="text-left font-mono">
                <h3 className="font-extrabold text-sm uppercase tracking-widest">Twilio WhatsApp Alert</h3>
                <p className="text-lacquer-deep/75 text-[9px] font-bold">Realtime Escalation Event triggered</p>
              </div>
              <button
                onClick={() => setEscalationAlert(null)}
                className="ml-auto text-lacquer-deep/70 hover:text-lacquer-deep p-1 cursor-pointer transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Content chat-bubble */}
            <div className="p-4 space-y-4 bg-lacquer-black border-t border-white/5 font-body">
              
              <div className="flex items-center gap-2 text-kinpaku-gold text-[10px] font-mono font-bold uppercase tracking-wider bg-kinpaku-gold/5 p-2 border border-kinpaku-gold/20 text-left">
                <AlertOctagon className="h-4.5 w-4.5 shrink-0" />
                <span>Ticket has hit 25+ votes! Twilio Sandbox Alert dispatched.</span>
              </div>

              {/* Chat Bubble */}
              <div className="bg-raised-lacquer text-champagne p-3.5 rounded-none border border-white/5 text-left text-xs font-mono whitespace-pre-wrap leading-relaxed shadow-lg select-text selection:bg-kinpaku-gold/30">
                {getWhatsAppMessageText(escalationAlert)}
              </div>

              <div className="flex gap-2 font-mono uppercase text-[10px] tracking-widest">
                <button
                  onClick={() => {
                    setEscalationAlert(null);
                    showToast("Alert simulated via Twilio sandbox API", "success");
                  }}
                  className="flex-1 bg-verdigris-patina hover:bg-patina-pale text-lacquer-deep font-extrabold py-2.5 rounded-none cursor-pointer transition text-center"
                >
                  Close WhatsApp Draft
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 11. TOAST ALERTS OVERLAY */}
      <div className="absolute bottom-6 right-6 z-[3000] flex flex-col gap-2 max-w-sm font-body">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-start gap-2.5 p-4 rounded-none border shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-4 backdrop-blur-md ${
              toast.type === 'success' 
                ? 'bg-raised-lacquer border-verdigris-patina/30 text-verdigris-patina' 
                : toast.type === 'error'
                ? 'bg-raised-lacquer border-vermilion-warning/30 text-vermilion-warning'
                : 'bg-raised-lacquer border-kinpaku-gold/30 text-kinpaku-gold'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-verdigris-patina" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="h-5 w-5 shrink-0 text-vermilion-warning" />
            ) : (
              <Info className="h-5 w-5 shrink-0 text-kinpaku-gold" />
            )}
            <div className="flex-1 text-left text-xs font-semibold text-champagne">
              {toast.message}
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-text-muted hover:text-champagne shrink-0 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
