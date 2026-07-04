import React, { useState, useEffect } from 'react';
import MapView from './components/MapView';
import FilterBar from './components/FilterBar';
import ReportForm from './components/ReportForm';
import SidePanel from './components/SidePanel';
import AuthModal from './components/AuthModal';
import { INITIAL_REPORTS, CATEGORIES } from './mockData';
import { 
  AlertCircle, CheckCircle2, Info, RefreshCw, X, Shield, 
  Map, Award, Flame, User, LogOut, MessageSquare, AlertOctagon, History, Loader2,
  Send, Mic, Bell, Settings, ArrowRight, Folder, MapPin, CheckCircle, Clock, ChevronRight, Sparkles, SendHorizontal
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
  
  // Navigation View State: 'dashboard' or 'map'
  const [viewMode, setViewMode] = useState('dashboard');
  
  // Modals & Panels State
  const [activeClick, setActiveClick] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showIntroPitch, setShowIntroPitch] = useState(true);
  
  // Interactive Overlays
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [escalationAlert, setEscalationAlert] = useState(null); // holds report details when 25 votes hit
  const [currentUser, setCurrentUser] = useState({
    id: "usr_patlolla",
    phone: "9876541169",
    name: "Patlolla",
    role: "citizen",
    ward: "Ward 112 (Hitech City)"
  }); // Pre-authenticate for demo experience matching screenshot "Patlolla"
  const [isPolling, setIsPolling] = useState(false);
  const [toasts, setToasts] = useState([]);

  // AI Chatbot State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: "Namaste! How can I help you today?" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

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

  // Citizen resolution confirmation
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
          showToast("Complaint reopened! Priority boosted for councillor review.", "error");
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

  const handleLogin = (user) => {
    setCurrentUser(user);
    showToast(`Logged in as ${user.name}`, "success");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast("Logged out successfully", "info");
  };

  // AI Chatbot message sender
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);

    setTimeout(() => {
      setChatLoading(false);
      const lower = userMsg.toLowerCase();
      let aiText = "Namaste! I can assist you with reporting civic issues. Please choose 'Raise Grievance' or click anywhere on the Map to drop a pin.";
      let categoryMatch = null;

      if (lower.includes('pothole') || lower.includes('road') || lower.includes('tarmac')) {
        categoryMatch = 'road_damage';
        aiText = "I've detected a potential Road Damage issue. Would you like to pinpoint it on the map and upload photo evidence for AI verification?";
      } else if (lower.includes('drain') || lower.includes('sewage') || lower.includes('mosquito')) {
        categoryMatch = 'open_drain';
        aiText = "I've detected an Open Drain grievance. Drainage overflow poses mosquito-breeding risks. Let's pin this location on the map!";
      } else if (lower.includes('light') || lower.includes('dark') || lower.includes('streetlight')) {
        categoryMatch = 'streetlight';
        aiText = "I've detected a Broken Streetlight issue. Dark lanes threaten citizen safety. Click below to locate and report this streetlight!";
      } else if (lower.includes('garbage') || lower.includes('dump') || lower.includes('trash') || lower.includes('waste')) {
        categoryMatch = 'garbage';
        aiText = "I've detected a Garbage Pile grievance. Overflowing bins are health hazards. Would you like to map this complaint?";
      } else if (lower.includes('water') || lower.includes('leak') || lower.includes('pipe')) {
        categoryMatch = 'water_leak';
        aiText = "I've detected a Water Pipe Leak. Clean water waste damages road tarmac. Let's map it immediately!";
      }

      setChatMessages(prev => [
        ...prev, 
        { 
          sender: 'ai', 
          text: aiText,
          action: categoryMatch ? { label: `Pin ${CATEGORIES[categoryMatch].label} on Map`, category: categoryMatch } : null
        }
      ]);
    }, 1200);
  };

  const handleChatAction = (category) => {
    setViewMode('map');
    setFilters(prev => ({ ...prev, category }));
    showToast(`Category filtered: ${CATEGORIES[category]?.label}. Tap on map to report!`, "info");
  };

  // Perform client-side filtering and sorting for display
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

  // Calculate quick dashboard stats
  const statsTotal = reports.length;
  const statsPending = reports.filter(r => r.status === 'pending').length;
  const statsInProgress = reports.filter(r => r.status === 'in_progress').length;
  const statsCompleted = reports.filter(r => r.status === 'resolved' || r.status === 'resolved_pending_confirmation').length;

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

  const getEmailMessageText = (alert) => {
    const catLabel = CATEGORIES[alert.category]?.label || alert.category;
    return `To: commissioner@ghmc.gov.in, councillor.${alert.ward.toLowerCase().replace(/\s+/g, '')}@ghmc.gov.in
Subject: URGENT: Civic Escalation - ${catLabel} - ${alert.ward} (25+ Citizen Votes)

Dear Commissioner and Local Councillor,

This is an automated dispatch from the Bharat Patrol Civic Accountability Platform.

A public grievance has reached the critical citizen threshold of 25 upvotes:
- Issue: ${catLabel}
- Location: GPS (${alert.description})
- Ward: ${alert.ward}
- Verification: AI Verified Photo Evidence

Under GHMC Service Level Agreement guidelines, urgent dispatch is requested to resolve this complaint.

Respectfully,
Bharat Patrol Accountability Engine`;
  };

  return (
    <div className="w-screen h-screen relative bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50/50 flex flex-col select-none overflow-x-hidden overflow-y-auto font-body text-slate-800">
      
      {/* 1. APP TOP BAR */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm sticky top-0 z-[1010] backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setViewMode('dashboard')}
            className="bg-gradient-to-tr from-orange-505 from-orange-500 to-red-600 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md font-display font-extrabold text-lg select-none cursor-pointer"
          >
            BP
          </div>
          <div className="text-left cursor-pointer" onClick={() => setViewMode('dashboard')}>
            <h1 className="text-slate-900 font-display font-extrabold text-xl leading-none tracking-tight">
              Bharat Patrol
            </h1>
            <p className="text-slate-400 text-[10px] tracking-wider uppercase font-semibold mt-0.5">MY CURE Accountability Portal</p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => showToast("No new alerts", "info")}
            className="bg-slate-50 border border-slate-200 text-slate-600 p-2.5 rounded-xl hover:bg-slate-100 transition relative cursor-pointer"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </button>
          
          <button 
            onClick={() => setIsSidePanelOpen(true)}
            className="bg-slate-50 border border-slate-200 text-slate-600 p-2.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            title="Settings"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>

          {/* Auth Display */}
          {currentUser ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-extrabold text-slate-800">Namaste, {currentUser.name}</span>
                <span className="text-[9px] text-slate-400 font-mono tracking-wider">GUEST CITIZEN</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-50 border border-red-200 text-red-600 p-2 rounded-xl hover:bg-red-100 transition cursor-pointer"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-red-650 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition cursor-pointer shadow-md hover:shadow-orange-500/10 flex items-center gap-1.5"
            >
              <User className="h-4 w-4 text-white" />
              Log In
            </button>
          )}
        </div>
      </header>

      {/* 2. DYNAMIC BROADCAST WEATHER/ALERTS TICKER */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-800 text-white py-2 px-6 overflow-hidden flex items-center shrink-0 border-b border-teal-900/10">
        <div className="bg-teal-900/30 text-teal-200 font-mono text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-teal-500/20 shrink-0 select-none mr-4">
          GhMC Alert
        </div>
        <div className="relative w-full flex items-center">
          <div className="animate-marquee whitespace-nowrap text-xs font-mono font-bold tracking-wider text-teal-150 flex gap-12">
            <span>🌦️ Hyderabad: 25.4°C • Humid Winds 24.3 km/h</span>
            <span>🚨 Mosquito Outbreak Warning - Stagnant drains flagged in Charminar area</span>
            <span>🚧 Jubilee Hills Road No. 36: Ward repair order active</span>
            <span>🔥 AI verified pipeline leakage auto-assigned to water works engineering</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT (DEFAULT VIEW) */}
      {viewMode === 'dashboard' ? (
        <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Namaste Greeting & Quick Stats */}
          <div className="flex flex-col md:flex-row items-stretch gap-4">
            
            {/* Waving Hand profile banner (Light Theme) */}
            <div className="flex-1 bg-white border border-slate-100 shadow-md rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4 text-left">
                <div className="bg-teal-50 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm shrink-0">
                  👋
                </div>
                <div>
                  <h2 className="text-slate-800 font-display font-black text-xl md:text-2xl leading-none">
                    Namaste, {currentUser ? currentUser.name : "Citizen"}
                  </h2>
                  <p className="text-slate-400 font-mono text-[10px] tracking-wider uppercase mt-1">
                    {currentUser ? `+91 •••••• ${currentUser.phone.slice(-4)}` : "Guest Access (Verification Locked)"}
                  </p>
                </div>
              </div>
              
              <div className="bg-sky-50 border border-sky-100 rounded-2xl py-2 px-4 text-right shadow-sm select-none">
                <span className="text-[9px] text-sky-500 font-bold block uppercase tracking-wider">Hyderabad</span>
                <span className="text-slate-800 font-mono font-extrabold text-base flex items-center gap-1">
                  ☁️ 25.4°C
                </span>
              </div>
            </div>

            {/* Quick Action Button to direct map access */}
            <button
              onClick={() => setViewMode('map')}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-extrabold px-6 py-5 rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg hover:shadow-orange-500/10 shrink-0 md:w-56 text-sm uppercase tracking-widest font-mono"
            >
              <Map className="h-5 w-5 animate-pulse text-white" />
              Open Live Map
            </button>
          </div>

          {/* Quick Stats Grid (From MY CURE layout) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition">
              <div className="text-left">
                <span className="text-[28px] font-black text-slate-800 font-mono block leading-none">{statsTotal}</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block mt-1">Submitted Grievances</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-slate-400">
                <Folder className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition">
              <div className="text-left">
                <span className="text-[28px] font-black text-slate-800 font-mono block leading-none">{statsPending}</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block mt-1">Pending Verification</span>
              </div>
              <div className="bg-orange-50 border border-orange-100 p-2.5 rounded-xl text-orange-500">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition">
              <div className="text-left">
                <span className="text-[28px] font-black text-slate-800 font-mono block leading-none">{statsInProgress}</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block mt-1">Work In Progress</span>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl text-blue-500">
                <RefreshCw className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition">
              <div className="text-left">
                <span className="text-[28px] font-black text-slate-800 font-mono block leading-none">{statsCompleted}</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block mt-1">Resolved complaints</span>
              </div>
              <div className="bg-teal-50 border border-teal-100 p-2.5 rounded-xl text-teal-500">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>

          </div>

          {/* Featured scrolling cards slider */}
          <div className="space-y-2">
            <h3 className="text-slate-800 text-xs font-bold uppercase tracking-widest flex items-center gap-1 text-left font-mono">
              <Sparkles className="h-4 w-4 text-orange-500" />
              Featured Services
            </h3>
            
            <div className="featured-scroll-container pb-2">
              
              {/* Card 1: Lodge Grievance */}
              <div 
                onClick={() => setViewMode('map')}
                className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-5 rounded-2xl min-w-[280px] w-80 text-left shadow-lg cursor-pointer transform hover:scale-102 transition flex flex-col justify-between h-40"
              >
                <div className="flex items-start justify-between">
                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10 text-white font-black text-lg">
                    ⚠️
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest font-extrabold bg-white/20 px-2 py-0.5 rounded border border-white/15">Active</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm tracking-wide">LODGE CIVIC GRIEVANCE</h4>
                  <p className="text-orange-100 text-[10px] mt-1 font-medium">Lodge and track citizen complaints with AI vision verification.</p>
                </div>
              </div>

              {/* Card 2: Density Map */}
              <div 
                onClick={() => { setViewMode('map'); setShowHeatmap(false); }}
                className="bg-gradient-to-br from-blue-500 to-indigo-650 text-white p-5 rounded-2xl min-w-[280px] w-80 text-left shadow-lg cursor-pointer transform hover:scale-102 transition flex flex-col justify-between h-40"
              >
                <div className="flex items-start justify-between">
                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10 text-white">
                    <Map className="h-5 w-5" />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest font-extrabold bg-white/20 px-2 py-0.5 rounded border border-white/15">Interactive</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm tracking-wide">LIVE GRIEVANCE MAP</h4>
                  <p className="text-blue-100 text-[10px] mt-1 font-medium">Browse neighborhood complaints, upvote tickets, and view active dispatches.</p>
                </div>
              </div>

              {/* Card 3: Heatmap Density */}
              <div 
                onClick={() => { setViewMode('map'); setShowHeatmap(true); }}
                className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-5 rounded-2xl min-w-[280px] w-80 text-left shadow-lg cursor-pointer transform hover:scale-102 transition flex flex-col justify-between h-40"
              >
                <div className="flex items-start justify-between">
                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10 text-white">
                    <Flame className="h-5 w-5 text-amber-300 animate-pulse" />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest font-extrabold bg-white/20 px-2 py-0.5 rounded border border-white/15">Hot-Spots</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm tracking-wide">DENSITY HEATMAP</h4>
                  <p className="text-amber-100 text-[10px] mt-1 font-medium">Pinpoint critical hubs of civic neglect based on crowdsourced upvotes.</p>
                </div>
              </div>

            </div>
          </div>

          {/* AI Grievance Assistant Chatbot (First Screenshot layout) */}
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[400px]">
            {/* Chatbot Header */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="bg-teal-100 p-2 rounded-xl text-teal-650">
                  <MessageSquare className="h-4.5 w-4.5" />
                </div>
                <div className="text-left">
                  <h3 className="font-display font-extrabold text-sm text-slate-850">AI Grievance Assistant</h3>
                  <p className="text-[9px] text-slate-400 font-mono tracking-wider uppercase font-semibold">Conversational Ticket Filing</p>
                </div>
              </div>
              
              <span className="bg-teal-50 text-teal-600 text-[9px] px-2 py-0.5 rounded-full border border-teal-100 font-mono uppercase tracking-widest font-bold">
                Llama 3 Text
              </span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/20">
              {chatMessages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm text-left ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200/80 text-slate-700 rounded-tl-none'
                  }`}>
                    {msg.text}

                    {/* Render Chat Actions */}
                    {msg.action && (
                      <div className="mt-3">
                        <button
                          onClick={() => handleChatAction(msg.action.category)}
                          className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-[10px] font-mono tracking-wider uppercase px-3.5 py-1.5 rounded-xl transition shadow flex items-center gap-1 cursor-pointer"
                        >
                          {msg.action.label}
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                    <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest animate-pulse">Assistant is typing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-150/70 bg-white flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => showToast("Microphone support requires permissions", "info")}
                className="bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 p-3 rounded-full transition cursor-pointer shrink-0 shadow-sm"
              >
                <Mic className="h-4.5 w-4.5" />
              </button>
              
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your issue here..."
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-850 rounded-2xl py-3 px-4 text-xs font-semibold placeholder:text-slate-350 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition shadow-sm"
              />

              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white p-3 rounded-full transition shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-orange-500/10"
              >
                <SendHorizontal className="h-4.5 w-4.5" />
              </button>
            </form>
          </div>

          {/* All services grid of 6 cards */}
          <div className="space-y-3 pt-2">
            <h3 className="text-slate-800 text-xs font-bold uppercase tracking-widest flex items-center gap-1 text-left font-mono">
              📂 All Services
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div 
                onClick={() => setViewMode('map')}
                className="bg-white border border-slate-200/80 hover:border-slate-350 p-4 rounded-2xl text-left cursor-pointer transition shadow-sm flex flex-col justify-between h-36"
              >
                <div className="bg-red-50 border border-red-150 p-2.5 rounded-xl text-red-655 w-fit">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Raise Grievance</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Lodge and track citizen complaints</p>
                </div>
              </div>

              <div 
                onClick={() => setViewMode('map')}
                className="bg-white border border-slate-200/80 hover:border-slate-350 p-4 rounded-2xl text-left cursor-pointer transition shadow-sm flex flex-col justify-between h-36"
              >
                <div className="bg-blue-50 border border-blue-150 p-2.5 rounded-xl text-blue-650 w-fit">
                  <Map className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Grievance Map</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Interactive map pins and status tracker</p>
                </div>
              </div>

              <div 
                onClick={() => setIsSidePanelOpen(true)}
                className="bg-white border border-slate-200/80 hover:border-slate-350 p-4 rounded-2xl text-left cursor-pointer transition shadow-sm flex flex-col justify-between h-36"
              >
                <div className="bg-yellow-50 border border-yellow-150 p-2.5 rounded-xl text-yellow-600 w-fit">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Impact Leaderboard</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Citizens ranking and reward achievements</p>
                </div>
              </div>

              <div 
                onClick={() => { setViewMode('map'); setShowHeatmap(true); }}
                className="bg-white border border-slate-200/80 hover:border-slate-350 p-4 rounded-2xl text-left cursor-pointer transition shadow-sm flex flex-col justify-between h-36"
              >
                <div className="bg-orange-50 border border-orange-150 p-2.5 rounded-xl text-orange-655 w-fit">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Neglect Heatmap</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Hot-spot density overlay coordinates</p>
                </div>
              </div>

              <div 
                onClick={() => setIsSidePanelOpen(true)}
                className="bg-white border border-slate-200/80 hover:border-slate-350 p-4 rounded-2xl text-left cursor-pointer transition shadow-sm flex flex-col justify-between h-36"
              >
                <div className="bg-purple-50 border border-purple-150 p-2.5 rounded-xl text-purple-600 w-fit">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Grievance History</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Track your historical submissions</p>
                </div>
              </div>

              <div 
                onClick={() => showToast("Hyderabad Central Ward Office is located in Khairatabad Division", "info")}
                className="bg-white border border-slate-200/80 hover:border-slate-350 p-4 rounded-2xl text-left cursor-pointer transition shadow-sm flex flex-col justify-between h-36"
              >
                <div className="bg-teal-50 border border-teal-150 p-2.5 rounded-xl text-teal-650 w-fit">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">My Ward Office</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Verify circular guidelines and local officials</p>
                </div>
              </div>

            </div>
          </div>

          {/* Footer developed by CGG logo */}
          <footer className="pt-6 pb-12 text-center space-y-2 border-t border-slate-200/50">
            <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-widest block">Designed & Developed By</span>
            <div className="flex items-center justify-center gap-1.5 text-teal-700 font-display font-black tracking-wide text-xs">
              <span className="bg-teal-550 bg-teal-600 text-white w-5.5 h-5.5 rounded-lg flex items-center justify-center text-[10px]">CGG</span>
              <span>CENTRE FOR GOOD GOVERNANCE</span>
            </div>
            <span className="text-[9px] text-slate-400 block font-medium">Knowledge • Technology • People</span>
          </footer>

        </main>
      ) : (
        /* 4. ACTIVE MAP OVERLAY VIEW */
        <div className="flex-1 w-full h-full relative flex">
          
          {/* Back to dashboard button overlay (Floating top left) */}
          <button
            onClick={() => {
              setViewMode('dashboard');
              showToast("Returned to Dashboard Portal", "info");
            }}
            className="absolute top-24 left-4 z-[1010] bg-white hover:bg-slate-50 text-slate-800 font-extrabold py-2.5 px-4 rounded-xl border border-slate-200 transition shadow-xl cursor-pointer flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider"
          >
            <ChevronRight className="h-4.5 w-4.5 rotate-180" />
            Dashboard
          </button>

          {/* Filter Bar overlay inside map view */}
          <FilterBar
            filters={filters}
            setFilters={setFilters}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onRefresh={() => fetchReports(true)}
            isPolling={isPolling}
          />

          {/* Leaflet map container */}
          <MapView
            reports={displayedReports}
            activeClick={activeClick}
            onMapClick={handleMapClick}
            onVote={handleVote}
            onConfirmResolution={handleConfirmResolution}
            showHeatmap={showHeatmap}
          />

          {/* Floating Controls Overlay (Right middle) */}
          <div className="absolute top-44 right-4 z-[1000] flex flex-col gap-3 font-mono uppercase tracking-widest text-[9px]">
            {/* Toggle Heatmap */}
            <button
              onClick={() => {
                setShowHeatmap(!showHeatmap);
                showToast(showHeatmap ? "Heatmap disabled" : "Heatmap density overlay enabled", "info");
              }}
              className={`p-3 rounded-xl shadow-2xl border font-bold flex items-center justify-center gap-2 transition cursor-pointer backdrop-blur-md ${
                showHeatmap 
                  ? 'bg-orange-500 border-transparent text-white shadow-orange-500/20' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Density Heatmap"
            >
              <Flame className={`h-5 w-5 ${showHeatmap ? 'animate-pulse text-white' : 'text-orange-500'}`} />
              <span className="hidden md:inline">Heatmap</span>
            </button>

            {/* Toggle Citizen SidePanel */}
            <button
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              className="p-3 rounded-xl shadow-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition cursor-pointer backdrop-blur-md"
              title="Citizen Leaderboard"
            >
              <Award className="h-5 w-5 text-orange-500" />
              <span className="hidden md:inline">Leaderboard</span>
            </button>
          </div>

        </div>
      )}

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

      {/* 7. PHONE OTP AUTH MODAL */}
      {isAuthModalOpen && (
        <AuthModal
          onLogin={handleLogin}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

      {/* 8. PITCH OPENING MODAL (ON FIRST LOAD) - Soft Light Gradient Theme */}
      {showIntroPitch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 font-body">
          <div className="bg-white border border-slate-100 w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-350">
            
            {/* Logo */}
            <div className="flex justify-center">
              <div className="bg-gradient-to-tr from-orange-505 from-orange-500 to-red-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-500/10 font-display font-extrabold text-3xl select-none">
                BP
              </div>
            </div>

            <div className="space-y-1.5 text-center">
              <h1 className="text-2xl md:text-3xl font-display font-extrabold text-slate-900 tracking-tight leading-none uppercase">
                Bharat Patrol
              </h1>
              <p className="text-[10px] font-mono tracking-widest font-extrabold text-teal-600 uppercase">
                India's First AI-Verified Infrastructure Accountability Portal
              </p>
            </div>

            {/* National Crisis Stats */}
            <div className="bg-slate-50 p-5 border border-slate-200/60 rounded-2xl space-y-4">
              <p className="text-xs text-slate-600 font-semibold leading-relaxed text-center">
                "10,476 Indians died last year because of potholes. Not because we don't know where the potholes are — because nobody is accountable for fixing them. Bharat Patrol changes that."
              </p>
              
              <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-center">
                <div className="bg-white p-3 border border-red-200/60 rounded-xl">
                  <span className="text-red-655 font-extrabold text-xl block">10,476</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Pothole Deaths/Yr</span>
                </div>
                <div className="bg-white p-3 border border-red-200/60 rounded-xl">
                  <span className="text-red-655 font-extrabold text-xl block">3.5L km</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Damaged Roads</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 font-mono text-[10px] tracking-widest uppercase">
              <button
                onClick={() => setShowIntroPitch(false)}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-extrabold py-4 px-6 rounded-2xl shadow-xl hover:shadow-orange-500/10 cursor-pointer transition text-xs"
              >
                Access Citizen Dashboard
              </button>
              <p className="text-[8px] text-slate-405 text-slate-400 font-semibold">
                Reference Model designed in compliance with Centre for Good Governance.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* 9. WHATSAPP & EMAIL DOUBLE ESCALATION ALERTS MODAL */}
      {escalationAlert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[4000] flex items-center justify-center p-4 font-body">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Escalation Title Bar */}
            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4 text-white flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div className="text-left font-mono">
                <h3 className="font-extrabold text-xs uppercase tracking-widest">Multi-Channel Escalation</h3>
                <p className="text-orange-100 text-[9px] font-bold">Priority score crossed 25 votes threshold</p>
              </div>
              <button
                onClick={() => setEscalationAlert(null)}
                className="ml-auto text-orange-100 hover:text-white bg-white/10 hover:bg-white/20 p-1 rounded-full cursor-pointer transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Content chat-bubble */}
            <div className="p-5 space-y-4 bg-slate-50/50">
              
              <div className="flex items-center gap-2 text-teal-650 text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-50 p-2.5 border border-teal-200 rounded-xl text-left">
                <AlertOctagon className="h-4.5 w-4.5 shrink-0 text-teal-600 animate-bounce" />
                <span>Twilio WhatsApp Dispatched & Official Department Email Fired!</span>
              </div>

              {/* Chat Bubble 1: WhatsApp */}
              <div className="space-y-1 text-left font-mono">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold">🟢 Twilio WhatsApp Councillor Payload</span>
                <div className="bg-white text-slate-700 p-3.5 rounded-2xl border border-slate-200 text-xs whitespace-pre-wrap leading-relaxed shadow-sm">
                  {getWhatsAppMessageText(escalationAlert)}
                </div>
              </div>

              {/* Chat Bubble 2: Email */}
              <div className="space-y-1 text-left font-mono">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold">🔵 Official Department Mailgun Payload</span>
                <div className="bg-white text-slate-700 p-3.5 rounded-2xl border border-slate-200 text-[10px] whitespace-pre-wrap leading-relaxed shadow-sm">
                  {getEmailMessageText(escalationAlert)}
                </div>
              </div>

              <div className="flex gap-2 font-mono uppercase text-[10px] tracking-widest pt-2">
                <button
                  onClick={() => {
                    setEscalationAlert(null);
                    showToast("Simulated dual WhatsApp/Email notifications to local department officials", "success");
                  }}
                  className="flex-1 bg-teal-650 bg-teal-600 hover:bg-teal-500 text-white font-extrabold py-3 rounded-2xl cursor-pointer transition text-center shadow-md hover:shadow-teal-500/10"
                >
                  Close Escalation Payloads
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 10. TOAST ALERTS OVERLAY */}
      <div className="fixed bottom-6 right-6 z-[3000] flex flex-col gap-2 max-w-sm font-body">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-start gap-2.5 p-4 rounded-xl border shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-4 backdrop-blur-md ${
              toast.type === 'success' 
                ? 'bg-white border-teal-500/30 text-teal-600' 
                : toast.type === 'error'
                ? 'bg-white border-red-500/30 text-red-655'
                : 'bg-white border-orange-500/30 text-orange-655'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-600" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            ) : (
              <Info className="h-5 w-5 shrink-0 text-orange-500" />
            )}
            <div className="flex-1 text-left text-xs font-bold text-slate-800">
              {toast.message}
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-700 shrink-0 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
