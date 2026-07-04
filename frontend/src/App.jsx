import React, { useState, useEffect } from 'react';
import MapView from './components/MapView';
import FilterBar from './components/FilterBar';
import ReportForm from './components/ReportForm';
import SidePanel from './components/SidePanel';
import AuthModal from './components/AuthModal';
import { INITIAL_REPORTS, CATEGORIES, WARDS_DATABASE } from './mockData';
import { 
  AlertCircle, CheckCircle2, Info, RefreshCw, X, Shield, 
  Map, Award, Flame, User, LogOut, MessageSquare, AlertOctagon, History, Loader2,
  Send, Mic, Bell, Settings, ArrowRight, Folder, MapPin, CheckCircle, Clock, ChevronRight, Sparkles, SendHorizontal, AlertTriangle
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
    "Ward 104 (Begumpet)"
  ];
  const index = Math.abs(Math.floor(lat * 1000 + lng * 1000)) % wards.length;
  return wards[index];
};

export default function App() {
  const [reports, setReports] = useState([]);
  const [votedReportIds, setVotedReportIds] = useState([]);
  const [filters, setFilters] = useState({ category: 'all', status: 'all' });
  const [sortBy, setSortBy] = useState('priority');
  
  // Navigation View State: 'dashboard' or 'map'
  const [viewMode, setViewMode] = useState('dashboard');
  
  // Modals & Panels State
  const [activeClick, setActiveClick] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  
  // Interactive Overlays
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [escalationAlert, setEscalationAlert] = useState(null); // holds report details when 25 votes hit
  
  // Signup State (Reads from LocalStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('tracespark_user') || localStorage.getItem('bharat_patrol_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [signupLoading, setSignupLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [weatherData, setWeatherData] = useState({ temp: "25.4°C", condition: "Humid Winds 24.3 km/h", city: "Hyderabad" });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m`);
            const data = await res.json();
            if (data.current) {
              setWeatherData({
                temp: `${data.current.temperature_2m}°C`,
                condition: `Wind ${data.current.wind_speed_10m} km/h`,
                city: "Your Location"
              });
            }
          } catch (e) {
            console.error("Weather fetch failed:", e);
          }
        },
        () => {}
      );
    }
  }, []);

  // Guest-friendly Deferred Auth States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('signin'); // 'signin' | 'signup'
  const [pendingAction, setPendingAction] = useState(null); // { type: 'vote'|'report', payload }

  // AI Chatbot State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: "Namaste! How can I help you today?" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [activeFormCategory, setActiveFormCategory] = useState(null);

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
          if (prev.length === 0) return INITIAL_REPORTS.map(r => ({ ...r, status: r.status === 'resolved_pending_confirmation' ? 'live' : r.status }));
          return prev;
        });
        if (showNotification) showToast("Mock data refreshed successfully", "success");
      } else {
        const url = new URL(`${API_BASE_URL}/reports`);
        url.searchParams.append('sort', sortBy === 'newest' ? 'date' : 'priority');

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Failed to fetch reports");
        const data = await res.json();
        
        // Map database fields to UI keys
        const mapped = data.map(r => ({
          ...r,
          priority_score: r.priority_score !== undefined ? r.priority_score : (r.vote_count || 0),
          ward: getMockWard(r.lat, r.lng)
        }));
        
        setReports(mapped);
        if (showNotification) showToast("Live reports synchronized", "success");
      }
    } catch (err) {
      console.error(err);
      showToast(`Network Sync Failed: ${err.message}`, "error");
    } finally {
      setIsPolling(false);
    }
  };

  const fetchUserVotes = async (userId) => {
    if (IS_MOCK_MODE || !userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/votes`);
      if (res.ok) {
        const data = await res.json();
        setVotedReportIds(data);
      }
    } catch (err) {
      console.error("Error fetching user votes:", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUserVotes(currentUser.id);
    } else {
      setVotedReportIds([]);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchReports();
    const interval = setInterval(() => {
      fetchReports(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [filters, sortBy]);

  // Handle Signup
  const handleSignup = async (name, phone, authMetadata = {}) => {
    setSignupLoading(true);
    try {
      let userObj = null;
      if (IS_MOCK_MODE) {
        userObj = {
          id: `usr_${Math.random().toString(36).substr(2, 9)}`,
          name,
          phone,
          verified: true,
          ...authMetadata
        };
      } else {
        const res = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, ...authMetadata })
        });
        
        if (!res.ok) throw new Error("Signup failed. Please try again.");
        const data = await res.json();
        userObj = { ...data, verified: true, ...authMetadata };
      }
      
      localStorage.setItem('tracespark_user', JSON.stringify(userObj));
      localStorage.setItem('bharat_patrol_user', JSON.stringify(userObj));
      setCurrentUser(userObj);
      setIsAuthModalOpen(false);
      showToast(`Welcome to TraceSpark, ${userObj.name}! (${userObj.loginType === 'google' ? 'Google Verified' : 'OTP Verified'})`, "success");

      // Execute deferred pending action
      if (pendingAction) {
        const action = pendingAction;
        setPendingAction(null); // Clear
        if (action.type === 'vote') {
          executeVoteWithUser(action.reportId, userObj.id);
        } else if (action.type === 'report') {
          executeReportSubmitWithUser(action.formData, userObj.id);
        }
      }
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    } finally {
      setSignupLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tracespark_user');
    localStorage.removeItem('bharat_patrol_user');
    setCurrentUser(null);
    showToast("Signed out successfully", "info");
  };

  // Handle map click
  const handleMapClick = (latlng) => {
    setActiveClick(latlng);
    setShowForm(true);
  };

  // Perform actual report submission logic (expects valid citizen/user id)
  const executeReportSubmitWithUser = async (formData, userId) => {
    const tempLocalId = Date.now();
    showToast("Analyzing photo evidence via Llama Vision...", "info");

    try {
      if (IS_MOCK_MODE) {
        setTimeout(() => {
          const newMockReport = {
            id: tempLocalId,
            user_id: userId,
            lat: formData.lat,
            lng: formData.lng,
            category: formData.category,
            description: `Multiple hazards located on the lane near coordinates. Auto-generated by AI Vision inspector.`,
            photo_url: formData.photo_url,
            ai_verified: true,
            ai_severity: 6,
            status: 'live',
            priority_score: 0,
            ward: getMockWard(formData.lat, formData.lng),
            created_at: new Date().toISOString()
          };
          setReports(prev => [newMockReport, ...prev]);
          showToast("Issue approved & pinned live!", "success");
        }, 1500);

      } else {
        const res = await fetch(`${API_BASE_URL}/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            lat: formData.lat,
            lng: formData.lng,
            category: formData.category,
            photo_url: formData.photo_url
          })
        });

        if (!res.ok) throw new Error("AI Inspector failed to verify report");
        const reportRow = await res.json();
        
        if (reportRow.status === 'rejected') {
          showToast("Photo Verification Failed: No civic hazard detected.", "error");
          setEscalationAlert({
            category: reportRow.category,
            ward: getMockWard(reportRow.lat, reportRow.lng),
            description: reportRow.description || "Our automated check couldn't verify a civic hazard in this photo. Please upload a clear picture showing road damage, garbage, or other infrastructure issues.",
            rejected: true
          });
        } else {
          const mappedReport = {
            ...reportRow,
            priority_score: reportRow.priority_score !== undefined ? reportRow.priority_score : 0,
            ward: getMockWard(reportRow.lat, reportRow.lng)
          };
          setReports(prev => [mappedReport, ...prev]);
          showToast("Photo Verified: Complaint is now live on the map!", "success");
        }
      }
    } catch (err) {
      console.error(err);
      showToast(`Submission failed: ${err.message}`, "error");
    }
  };

  // Handle report submission trigger
  const handleReportSubmit = async (formData) => {
    setShowForm(false);
    setActiveClick(null);
    setActiveFormCategory(null);

    if (!currentUser) {
      setPendingAction({ type: 'report', formData });
      setAuthModalTab('signin');
      setIsAuthModalOpen(true);
      showToast("Verification required to lodge civic reports.", "info");
      return;
    }

    await executeReportSubmitWithUser(formData, currentUser.id);
  };

  // Perform actual vote logic (expects valid citizen/user id)
  const executeVoteWithUser = async (reportId, userId) => {
    try {
      if (IS_MOCK_MODE) {
        setReports(prev =>
          prev.map(r => {
            if (r.id === reportId) {
              const newScore = r.priority_score + 1;
              if (newScore === 25) {
                setEscalationAlert({
                  id: r.id,
                  category: r.category,
                  ward: r.ward,
                  priority_score: newScore,
                  description: r.description
                });
              }
              return { ...r, priority_score: newScore };
            }
            return r;
          })
        );
        setVotedReportIds(prev => [...prev, reportId]);
        showToast("Upvoted! Priority score increased.", "success");
      } else {
        const res = await fetch(`${API_BASE_URL}/reports/${reportId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId })
        });
        
        if (!res.ok) throw new Error("Failed to register upvote");
        const data = await res.json();
        
        setReports(prev =>
          prev.map(r => {
            if (r.id === reportId) {
              return { ...r, priority_score: data.priority_score };
            }
            return r;
          })
        );
        
        if (data.isNewVote) {
          setVotedReportIds(prev => [...prev, reportId]);
          showToast("Vote recorded!", "success");
        } else {
          showToast("You have already voted for this report.", "info");
        }

        if (data.escalation_fired) {
          const currentReport = reports.find(r => r.id === reportId);
          setEscalationAlert({
            id: reportId,
            category: currentReport?.category || 'General Issue',
            ward: currentReport?.ward || 'Local Ward',
            priority_score: data.priority_score,
            description: currentReport?.description || 'Public hazard has been escalated.'
          });
        }
      }
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    }
  };

  // Handle vote trigger
  const handleVote = async (reportId) => {
    if (!currentUser) {
      setPendingAction({ type: 'vote', reportId });
      setAuthModalTab('signin');
      setIsAuthModalOpen(true);
      showToast("Verification required to cast upvotes.", "info");
      return;
    }
    await executeVoteWithUser(reportId, currentUser.id);
  };

  // AI Chatbot message sender
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);

    const lower = userMsg.toLowerCase();
    let actionObj = null;

    // Determine if query implies a quick action button (reporting or viewing map)
    if (lower.includes('pothole') || lower.includes('road') || lower.includes('tarmac') || lower.includes('crack')) {
      actionObj = { label: `Pin Road Damage on Map`, category: 'road_damage', type: 'report' };
    } else if (lower.includes('drain') || lower.includes('sewage') || lower.includes('mosquito') || lower.includes('manhole') || lower.includes('overflow')) {
      actionObj = { label: `Pin Open Drain on Map`, category: 'open_drain', type: 'report' };
    } else if (lower.includes('light') || lower.includes('dark') || lower.includes('streetlight') || lower.includes('lamp') || lower.includes('night')) {
      actionObj = { label: `Pin Streetlight on Map`, category: 'streetlight', type: 'report' };
    } else if (lower.includes('garbage') || lower.includes('dump') || lower.includes('trash') || lower.includes('waste') || lower.includes('bin')) {
      actionObj = { label: `Pin Garbage Pile on Map`, category: 'garbage', type: 'report' };
    } else if (lower.includes('water') || lower.includes('leak') || lower.includes('pipe') || lower.includes('burst') || lower.includes('flooding')) {
      actionObj = { label: `Pin Water Leak on Map`, category: 'water_leak', type: 'report' };
    } else if (lower.includes('encroach') || lower.includes('footpath') || lower.includes('vendor') || lower.includes('illegal') || lower.includes('block')) {
      actionObj = { label: `Pin Encroachment on Map`, category: 'encroachment', type: 'report' };
    } else if (lower.includes('tree') || lower.includes('branch') || lower.includes('fallen') || lower.includes('storm')) {
      actionObj = { label: `Pin Fallen Tree on Map`, category: 'fallen_tree', type: 'report' };
    } else if (lower.includes('bus') || lower.includes('shelter') || lower.includes('bench') || lower.includes('stop')) {
      actionObj = { label: `Pin Bus Stop Issue on Map`, category: 'bus_stop', type: 'report' };
    } else if (lower.includes('urgent') || lower.includes('top') || lower.includes('highest') || lower.includes('priority') || lower.includes('critical') || lower.includes('escalat')) {
      const topReport = [...reports].sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))[0];
      if (topReport) {
        const catLabel = CATEGORIES[topReport.category]?.label || topReport.category;
        actionObj = { label: `View ${catLabel} on Map`, category: topReport.category, type: 'view_report', targetReport: topReport };
      }
    }

    try {
      if (API_BASE_URL) {
        const topReport = [...reports].sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))[0];
        const res = await fetch(`${API_BASE_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMsg,
            context: { totalReports: reports.length, topReport }
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.reply) {
            setChatMessages(prev => [...prev, { sender: 'ai', text: data.reply, action: actionObj }]);
            setChatLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn("Backend chat API offline, switching to contextual civic engine:", err);
    }

    // Client-Side Intelligent Dynamic Civic Engine (when backend API is offline/mock)
    setTimeout(() => {
      setChatLoading(false);
      let aiText = "";

      if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('help') || lower.includes('what can you do') || lower.includes('who are you')) {
        aiText = `Namaste! 🙏 I am TraceSpark AI, your civic accountability assistant for Hyderabad (GHMC). I can help you with:\n\n1️⃣ **Find Ward Councillors**: Ask *"Who is the councillor for Charminar or Ward 112?"*\n2️⃣ **Track Urgent Hazards**: Ask *"What is the most critical issue right now?"*\n3️⃣ **Check Live Stats**: Ask *"How many reports are live?"*\n4️⃣ **Report Hazards**: Tell me *"there is a broken streetlight"* or *"pothole"* and I'll drop a pin!`;
      } else if (lower.includes('urgent') || lower.includes('top') || lower.includes('highest') || lower.includes('priority') || lower.includes('critical') || lower.includes('escalat')) {
        const topReport = [...reports].sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))[0];
        if (topReport) {
          const catLabel = CATEGORIES[topReport.category]?.label || topReport.category;
          const votesNeeded = Math.max(0, 25 - (topReport.priority_score || 0));
          aiText = `Currently, our #1 most critical hazard is a **${catLabel}** in **${topReport.ward}** with 🔥 **${topReport.priority_score} citizen upvotes**!\n\n${votesNeeded > 0 ? `👉 Only **${votesNeeded} more vote(s)** needed to trigger an automated WhatsApp SLA escalation to the Zonal Commissioner!` : '✅ **SLA Alert Fired!** Official WhatsApp notification has been dispatched to the municipal ward office.'}`;
        } else {
          aiText = "All community grievances are currently under control or resolved! Would you like to report a new infrastructure issue?";
        }
      } else if (lower.includes('councillor') || lower.includes('ward') || lower.includes('contact') || lower.includes('who') || lower.includes('responsible') || lower.includes('ghmc') || lower.includes('office') || lower.includes('zonal') || lower.includes('commissioner')) {
        // Search if a specific ward is mentioned
        let matchedWardKey = Object.keys(WARDS_DATABASE).find(k => lower.includes(k.toLowerCase()) || lower.includes(k.split(' ')[0].toLowerCase()));
        if (!matchedWardKey) {
          if (lower.includes('112') || lower.includes('hitech')) matchedWardKey = 'Ward 112 (Hitech City)';
          else if (lower.includes('80') || lower.includes('charminar')) matchedWardKey = 'Ward 80 (Charminar)';
          else if (lower.includes('95') || lower.includes('khairatabad')) matchedWardKey = 'Ward 95 (Khairatabad)';
          else if (lower.includes('101') || lower.includes('jubilee')) matchedWardKey = 'Ward 101 (Jubilee Hills)';
          else if (lower.includes('120') || lower.includes('kukatpally')) matchedWardKey = 'Ward 120 (Kukatpally)';
          else if (lower.includes('85') || lower.includes('koti')) matchedWardKey = 'Ward 85 (Koti & Abids)';
          else if (lower.includes('98') || lower.includes('gachibowli')) matchedWardKey = 'Ward 98 (Gachibowli)';
          else if (lower.includes('104') || lower.includes('begumpet')) matchedWardKey = 'Ward 104 (Begumpet)';
          else matchedWardKey = 'Ward 112 (Hitech City)'; // default illustration
        }
        const wardInfo = WARDS_DATABASE[matchedWardKey];
        const wardReportsCount = reports.filter(r => r.ward === matchedWardKey).length;
        aiText = `🏢 **Municipal Ward Directory (${matchedWardKey})**:\n\n• **Zonal Commissioner**: ${wardInfo.councillor_name}\n• **Office Address**: ${wardInfo.office_address}\n• **Official Phone**: ${wardInfo.councillor_phone}\n• **Active Reports**: ${wardReportsCount} citizen complaint(s)\n\nUnder GHMC SLA guidelines, when any report reaches 25 upvotes, an instant WhatsApp alert is dispatched directly to this office!`;
      } else if (lower.includes('stat') || lower.includes('how many') || lower.includes('total') || lower.includes('summary') || lower.includes('count') || lower.includes('number') || lower.includes('status')) {
        const liveCount = reports.filter(r => r.status === 'live' || r.status === 'in_progress').length;
        const resolvedCount = reports.filter(r => r.status === 'resolved').length;
        aiText = `📊 **TraceSpark Live Civic Stats (Hyderabad)**:\n\n• **Total Submissions**: ${reports.length} verified reports\n• **Live & In-Progress**: ${liveCount} active hazards\n• **Resolved Issues**: ${resolvedCount} completed repairs\n• **AI Verification Rate**: 100% automated vision inspection\n\nYou can filter these reports by category or ward using the dashboard tools!`;
      } else if (lower.includes('vote') || lower.includes('25') || lower.includes('threshold') || lower.includes('happen') || lower.includes('sla') || lower.includes('rule') || lower.includes('upvote')) {
        aiText = `⚡ **How SLA Escalations Work**:\n\n1️⃣ A citizen captures a photo of a civic hazard.\n2️⃣ Our **Llama 3 Vision AI** verifies the issue and assigns a severity rating (1-5).\n3️⃣ The report goes live on the heatmap. As locals upvote it, the priority score rises.\n4️⃣ At exactly **25 verified citizen votes**, an automated **Twilio WhatsApp & Email dispatch** is triggered instantly to the Zonal Commissioner of that ward!`;
      } else if (lower.includes('near') || lower.includes('location') || lower.includes('map') || lower.includes('where') || lower.includes('gps')) {
        aiText = `📍 All active community grievances are plotted on our interactive heatmap! Currently, we are tracking **${reports.length} verified hazards** across Hyderabad. You can tap any pin on the map to inspect evidence photos, check SLA timers, or cast your vote!`;
      } else if (actionObj) {
        aiText = `I have identified your report request for **${CATEGORIES[actionObj.category]?.label || actionObj.category}**. Physical infrastructure hazards require municipal attention. Click the button below or tap any location on the map to open the verification submission form!`;
      } else {
        // Dynamic contextual fallback for any custom query
        aiText = `Regarding your inquiry about "${userMsg}": TraceSpark tracks municipal infrastructure health across 150 GHMC wards in Hyderabad. We currently have **${reports.length} active citizen reports** on file.\n\nYou can explore live complaints on the heatmap, check Zonal Commissioner contacts, or tap the map to report a new hazard instantly!`;
      }

      setChatMessages(prev => [
        ...prev, 
        { 
          sender: 'ai', 
          text: aiText,
          action: actionObj
        }
      ]);
    }, 600);
  };

  const handleChatAction = (category, actionType = 'report', targetReport = null) => {
    if (actionType === 'view_report' && targetReport) {
      setViewMode('map');
      setFilters(prev => ({ ...prev, category: targetReport.category }));
      showToast(`Viewing urgent hazard: ${CATEGORIES[targetReport.category]?.label} (${targetReport.priority_score} votes)`, "info");
      return;
    }

    // Default: actionType === 'report'
    setViewMode('map');
    setFilters(prev => ({ ...prev, category }));
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setActiveClick({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setActiveFormCategory(category);
          setShowForm(true);
          showToast(`Pinpoint dropped at your location for ${CATEGORIES[category]?.label}. Please attach photo!`, "info");
        },
        () => {
          setActiveClick({ lat: 17.3850, lng: 78.4867 });
          setActiveFormCategory(category);
          setShowForm(true);
          showToast(`Pinpoint dropped at default center for ${CATEGORIES[category]?.label}. Please attach photo!`, "info");
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setActiveClick({ lat: 17.3850, lng: 78.4867 });
      setActiveFormCategory(category);
      setShowForm(true);
    }
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
  const statsLive = reports.filter(r => r.status === 'live').length;

  const getWhatsAppMessageText = (alert) => {
    const catLabel = CATEGORIES[alert.category]?.label || alert.category;
    const councillor = WARDS_DATABASE[alert.ward] || {
      councillor_name: "Sri K. Venkatesh (Zonal Commissioner)",
      councillor_phone: "+91 94400 08000",
      councillor_email: "councillor.ghmc@gov.in",
      office_address: "GHMC Municipal Ward Office"
    };

    return `🚨 *TRACESPARK URGENT CIVIC ESCALATION* 🚨

*Attention Ward Councillor:*
👤 ${councillor.councillor_name}
📍 ${alert.ward}
🏢 ${councillor.office_address}
📞 Official Contact: ${councillor.councillor_phone}

*Grievance Details:*
• *Issue*: ${catLabel}
• *Description*: ${alert.description}
• *Verified Citizen Votes*: 🔥 ${alert.priority_score} (Threshold Reached!)
• *AI Severity*: Level ${alert.ai_severity || 5}/5
• *Status*: Live / SLA Urgent Dispatch Required

An alert has been dispatched automatically via Twilio WhatsApp Gateway.`;
  };

  const getEmailMessageText = (alert) => {
    const catLabel = CATEGORIES[alert.category]?.label || alert.category;
    const councillor = WARDS_DATABASE[alert.ward] || {
      councillor_name: "Sri K. Venkatesh",
      councillor_phone: "+91 94400 08000",
      councillor_email: "councillor@ghmc.gov.in"
    };

    return `To: commissioner@ghmc.gov.in, ${councillor.councillor_email}
Subject: URGENT ESCALATION: ${catLabel} in ${alert.ward} (${alert.priority_score}+ Citizen Votes)

Dear ${councillor.councillor_name} (Ward Councillor, ${alert.ward}),

This is an automated SLA escalation from the TraceSpark Civic Accountability Portal.

A public grievance in your constituency has crossed the mandatory citizen threshold of 25 upvotes:
- Issue Type: ${catLabel}
- Ward / Constituency: ${alert.ward}
- Official Contact on File: ${councillor.councillor_phone}
- Description & Coordinates: ${alert.description}
- Verification: 100% AI Vision Checked

Under GHMC Service Level Agreement guidelines, immediate municipal action is requested.`;
  };

  return (
    <div className="w-screen h-screen relative bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50/50 flex flex-col select-none overflow-x-hidden overflow-y-auto font-body text-slate-800">
      
      {/* 1. APP TOP BAR */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm sticky top-0 z-[1010] backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.jpeg" 
            alt="TraceSpark" 
            onClick={() => setViewMode('dashboard')}
            className="w-10 h-10 rounded-xl object-cover shadow-md select-none cursor-pointer"
          />
          <div className="text-left cursor-pointer" onClick={() => setViewMode('dashboard')}>
            <h1 className="text-slate-900 font-display font-extrabold text-xl leading-none tracking-tight">
              TraceSpark
            </h1>
            <p className="text-slate-400 text-[10px] tracking-wider uppercase font-semibold mt-0.5">AI Civic Accountability Loop</p>
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

          {/* User Details / Sign Up Trigger */}
          {currentUser ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-extrabold text-slate-800">Namaste, {currentUser.name}</span>
                <span className="text-[9px] text-slate-400 font-mono tracking-wider">Verified Citizen</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-50 border border-red-200 text-red-600 p-2 rounded-xl hover:bg-red-100 transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setAuthModalTab('signin'); setIsAuthModalOpen(true); }}
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-mono font-extrabold text-xs uppercase tracking-wider py-2 px-3.5 rounded-xl transition cursor-pointer shadow-2xs"
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthModalTab('signup'); setIsAuthModalOpen(true); }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-mono font-extrabold text-xs uppercase tracking-wider py-2 px-3.5 rounded-xl transition cursor-pointer shadow-sm border border-slate-800"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. DYNAMIC BROADCAST WEATHER/ALERTS TICKER */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-800 text-white py-2 px-6 overflow-hidden flex items-center shrink-0 border-b border-teal-900/10">
        <div className="bg-teal-900/30 text-teal-200 font-mono text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-teal-500/20 shrink-0 select-none mr-4">
          TraceSpark Alert
        </div>
        <div className="relative w-full flex items-center overflow-hidden">
          <div className="animate-marquee whitespace-nowrap text-xs font-mono font-bold tracking-wider text-teal-100 flex gap-12">
            <span>🌦️ {weatherData.city}: {weatherData.temp} • {weatherData.condition}</span>
            <span>🚨 Mosquito Outbreak Warning - Stagnant drains flagged in Charminar area</span>
            <span>🚧 Jubilee Hills Road No. 36: Ward repair order active</span>
            <span>🔥 AI verified pipeline leakage auto-assigned to water works engineering</span>
            <span>🌦️ {weatherData.city}: {weatherData.temp} • {weatherData.condition}</span>
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
                  <h2 className="text-slate-800 font-display font-black text-xl md:text-2xl leading-none flex items-center gap-2">
                    <span>Namaste, {currentUser ? currentUser.name : "Citizen (Guest)"}</span>
                    {currentUser?.verified && (
                      <span className="bg-teal-50 text-teal-600 border border-teal-200 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full shadow-2xs">
                        ✓ {currentUser.loginType === 'google' ? 'Google Verified' : 'OTP Verified'}
                      </span>
                    )}
                  </h2>
                  <p className="text-slate-400 font-mono text-[10px] tracking-wider uppercase mt-1.5">
                    {currentUser ? `${currentUser.email || `+91 •••••• ${currentUser.phone.slice(-4)}`} • Verified Citizen` : "Guest Access Mode • Verification Required to Vote"}
                  </p>
                </div>
              </div>
              
              <div className="bg-sky-50 border border-sky-100 rounded-2xl py-2 px-4 text-right shadow-sm select-none">
                <span className="text-[9px] text-sky-500 font-bold block uppercase tracking-wider">{weatherData.city}</span>
                <span className="text-slate-800 font-mono font-extrabold text-base flex items-center gap-1">
                  ☁️ {weatherData.temp}
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

          {/* National Crisis Stats Integrated Direct in Dashboard */}
          <div className="bg-slate-50 p-5 border border-slate-200/60 rounded-2xl space-y-4 text-left shadow-xs">
            <h3 className="text-slate-800 text-[10px] font-mono tracking-widest font-extrabold uppercase flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-orange-500" />
              Platform Objective & Civic Problem Scale
            </h3>
            <p className="text-xs text-slate-700 font-bold leading-relaxed">
              "10,476 Indians died last year because of potholes. Not because we don't know where the potholes are — because nobody is accountable for fixing them. TraceSpark changes that by linking citizen crowdsourcing directly with Councillor WhatsApp dispatches."
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 font-mono text-center">
              <div className="bg-white p-3 border border-red-200/50 rounded-xl shadow-2xs">
                <span className="text-red-600 font-extrabold text-lg block">10,476</span>
                <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Pothole Deaths/Yr</span>
              </div>
              <div className="bg-white p-3 border border-red-200/50 rounded-xl shadow-2xs">
                <span className="text-red-600 font-extrabold text-lg block">3.5L km</span>
                <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Damaged Roads</span>
              </div>
              <div className="bg-white p-3 border border-emerald-200/50 rounded-xl shadow-2xs">
                <span className="text-teal-600 font-extrabold text-lg block">100%</span>
                <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">AI Vision Check</span>
              </div>
              <div className="bg-white p-3 border border-teal-200/50 rounded-xl shadow-2xs">
                <span className="text-teal-600 font-extrabold text-lg block">25 Votes</span>
                <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Auto-Escalation</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition">
              <div className="text-left">
                <span className="text-[28px] font-black text-slate-800 font-mono block leading-none">{statsTotal}</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block mt-1">Total Reports</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-slate-400">
                <Folder className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition">
              <div className="text-left">
                <span className="text-[28px] font-black text-slate-800 font-mono block leading-none">{statsPending}</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block mt-1">AI Pending</span>
              </div>
              <div className="bg-orange-50 border border-orange-100 p-2.5 rounded-xl text-orange-500">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition">
              <div className="text-left">
                <span className="text-[28px] font-black text-slate-800 font-mono block leading-none">{statsInProgress}</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block mt-1">Work Orders Dispatch</span>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl text-blue-500">
                <RefreshCw className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition">
              <div className="text-left">
                <span className="text-[28px] font-black text-slate-800 font-mono block leading-none">{statsLive}</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block mt-1">Live Verified</span>
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
                    🚨
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest font-extrabold bg-white/20 px-2 py-0.5 rounded border border-white/15">Report</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm tracking-wide">TAP MAP TO REPORT</h4>
                  <p className="text-orange-100 text-[10px] mt-1 font-medium">Lodge issue coordinates with inline AI Vision verification check.</p>
                </div>
              </div>

              {/* Card 2: Live Map */}
              <div 
                onClick={() => { setViewMode('map'); setShowHeatmap(false); }}
                className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-5 rounded-2xl min-w-[280px] w-80 text-left shadow-lg cursor-pointer transform hover:scale-102 transition flex flex-col justify-between h-40"
              >
                <div className="flex items-start justify-between">
                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10 text-white">
                    <Map className="h-5 w-5" />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest font-extrabold bg-white/20 px-2 py-0.5 rounded border border-white/15">Explorer</span>
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

          {/* AI Grievance Assistant Chatbot */}
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[380px]">
            {/* Chatbot Header */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="bg-teal-100 p-2 rounded-xl text-teal-600">
                  <MessageSquare className="h-4.5 w-4.5" />
                </div>
                <div className="text-left">
                  <h3 className="font-display font-extrabold text-sm text-slate-900">AI Grievance Assistant</h3>
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
                          onClick={() => handleChatAction(msg.action.category, msg.action.type, msg.action.targetReport)}
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
                onClick={() => showToast("Microphone requires browser permissions", "info")}
                className="bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 p-3 rounded-full transition cursor-pointer shrink-0 shadow-sm"
              >
                <Mic className="h-4.5 w-4.5" />
              </button>
              
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your issue here..."
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl py-3 px-4 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition shadow-sm"
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

          {/* All services grid */}
          <div className="space-y-3 pt-2">
            <h3 className="text-slate-800 text-xs font-bold uppercase tracking-widest flex items-center gap-1 text-left font-mono">
              📂 All Services
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div 
                onClick={() => setViewMode('map')}
                className="bg-white border border-slate-200/80 hover:border-slate-300 p-4 rounded-2xl text-left cursor-pointer transition shadow-sm flex flex-col justify-between h-36"
              >
                <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl text-red-600 w-fit">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Raise Grievance</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Lodge and track citizen complaints</p>
                </div>
              </div>

              <div 
                onClick={() => setViewMode('map')}
                className="bg-white border border-slate-200/80 hover:border-slate-300 p-4 rounded-2xl text-left cursor-pointer transition shadow-sm flex flex-col justify-between h-36"
              >
                <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl text-blue-600 w-fit">
                  <Map className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Grievance Map</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Interactive map pins and status tracker</p>
                </div>
              </div>


              <div 
                onClick={() => { setViewMode('map'); setShowHeatmap(true); }}
                className="bg-white border border-slate-200/80 hover:border-slate-300 p-4 rounded-2xl text-left cursor-pointer transition shadow-sm flex flex-col justify-between h-36"
              >
                <div className="bg-orange-50 border border-orange-200 p-2.5 rounded-xl text-orange-500 w-fit">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Neglect Heatmap</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Hot-spot density overlay coordinates</p>
                </div>
              </div>

              <div 
                onClick={() => setIsSidePanelOpen(true)}
                className="bg-white border border-slate-200/80 hover:border-slate-300 p-4 rounded-2xl text-left cursor-pointer transition shadow-sm flex flex-col justify-between h-36"
              >
                <div className="bg-purple-50 border border-purple-200 p-2.5 rounded-xl text-purple-600 w-fit">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Grievance History</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Track your historical submissions</p>
                </div>
              </div>

              <div 
                onClick={() => showToast("Circular manual matched for ward operations guidelines", "info")}
                className="bg-white border border-slate-200/80 hover:border-slate-300 p-4 rounded-2xl text-left cursor-pointer transition shadow-sm flex flex-col justify-between h-36"
              >
                <div className="bg-teal-50 border border-teal-200 p-2.5 rounded-xl text-teal-600 w-fit">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">My Ward Office</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Circular manuals and emergency numbers</p>
                </div>
              </div>

            </div>
          </div>

          {/* Footer developed by CGG logo */}
          <footer className="pt-6 pb-12 text-center space-y-2 border-t border-slate-200/50">
            <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-widest block">Designed & Developed By</span>
            <div className="flex items-center justify-center gap-1.5 text-teal-700 font-display font-black tracking-wide text-xs">
              <span className="bg-teal-600 text-white w-5.5 h-5.5 rounded-lg flex items-center justify-center text-[10px]">CGG</span>
              <span>CENTRE FOR GOOD GOVERNANCE</span>
            </div>
            <span className="text-[9px] text-slate-400 block font-medium">Knowledge • Technology • People</span>
          </footer>

        </main>
      ) : (
        /* 4. ACTIVE MAP OVERLAY VIEW */
        <div className="flex-1 w-full h-full relative flex">
          {/* Filter Bar overlay inside map view */}
          <FilterBar
            filters={filters}
            setFilters={setFilters}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onRefresh={() => fetchReports(true)}
            isPolling={isPolling}
            onBackToDashboard={() => {
              setViewMode('dashboard');
              showToast("Returned to Dashboard Portal", "info");
            }}
          />

          {/* Leaflet map container */}
          <MapView
            reports={displayedReports}
            activeClick={activeClick}
            onMapClick={handleMapClick}
            onVote={handleVote}
            onConfirmResolution={() => {}}
            showHeatmap={showHeatmap}
            onToggleHeatmap={() => {
              setShowHeatmap(!showHeatmap);
              showToast(showHeatmap ? "Heatmap disabled" : "Heatmap density overlay enabled", "info");
            }}
            onOpenHistory={() => setIsSidePanelOpen(true)}
            votedReportIds={votedReportIds}
          />
        </div>
      )}

      {/* 5. SLIDING PANEL (CITIZEN REPORTS) */}
      <SidePanel
        isOpen={isSidePanelOpen}
        onClose={() => setIsSidePanelOpen(false)}
        reports={reports}
        currentUser={currentUser}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* 6. REPORT FORM MODAL */}
      {showForm && activeClick && (
        <ReportForm
          lat={activeClick.lat}
          lng={activeClick.lng}
          initialCategory={activeFormCategory}
          onSubmit={handleReportSubmit}
          onClose={() => {
            setShowForm(false);
            setActiveClick(null);
            setActiveFormCategory(null);
          }}
        />
      )}

      {/* 7. DUAL ESCALATION PAYLOADS MODAL */}
      {escalationAlert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[4000] flex items-center justify-center p-4 font-body">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4 text-white flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <AlertOctagon className="h-5 w-5 text-white" />
              </div>
              <div className="text-left font-mono">
                <h3 className="font-extrabold text-xs uppercase tracking-widest">
                  {escalationAlert.rejected ? "Photo Verification Failed" : "Auto Escalation Fired"}
                </h3>
                <p className="text-orange-100 text-[9px] font-bold">
                  {escalationAlert.rejected ? "Automated Civic Quality Check" : "Priority crossed 25 votes threshold"}
                </p>
              </div>
              <button
                onClick={() => setEscalationAlert(null)}
                className="ml-auto text-orange-100 hover:text-white bg-white/10 hover:bg-white/20 p-1 rounded-full cursor-pointer transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Content payloads */}
            <div className="p-5 space-y-4 bg-slate-50/50">
              {escalationAlert.rejected ? (
                <div className="space-y-3 text-left">
                  <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-red-600 font-mono text-[10px] font-bold leading-normal flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500 animate-bounce" />
                    <span>Our quality check couldn't verify a civic infrastructure hazard in this photo. To prevent spam and false alarms, complaints must clearly show road damage, garbage piles, or other civic issues.</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-xs font-semibold text-slate-700 leading-relaxed">
                    {escalationAlert.description}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-teal-600 text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-50 p-2.5 border border-teal-200 rounded-xl text-left">
                    <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-teal-600 animate-pulse" />
                    <span>WhatsApp Sandbox Alert Fired & Councillor Email Dispatched!</span>
                  </div>

                  <div className="space-y-1 text-left font-mono">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold">🟢 Twilio Councillor WhatsApp Payload</span>
                    <div className="bg-white text-slate-800 p-3.5 rounded-2xl border border-slate-200 text-xs whitespace-pre-wrap leading-relaxed shadow-sm">
                      {getWhatsAppMessageText(escalationAlert)}
                    </div>
                  </div>

                  <div className="space-y-1 text-left font-mono">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold">🔵 Official Department Mailgun Payload</span>
                    <div className="bg-white text-slate-800 p-3.5 rounded-2xl border border-slate-200 text-[10px] whitespace-pre-wrap leading-relaxed shadow-sm">
                      {getEmailMessageText(escalationAlert)}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2 font-mono uppercase text-[10px] tracking-widest pt-2">
                <button
                  onClick={() => setEscalationAlert(null)}
                  className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-extrabold py-3 rounded-2xl cursor-pointer transition text-center shadow-md hover:shadow-teal-500/10"
                >
                  {escalationAlert.rejected ? "Got It, I'll Try Again" : "Confirm Alert"}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 8. INLINE AUTHENTICATION MODAL */}
      {isAuthModalOpen && (
        <AuthModal
          initialTab={authModalTab}
          onSignup={handleSignup}
          loading={signupLoading}
          onClose={() => {
            setIsAuthModalOpen(false);
            setPendingAction(null);
          }}
        />
      )}

      {/* 9. TOAST ALERTS OVERLAY */}
      <div className="fixed bottom-6 right-6 z-[3000] flex flex-col gap-2 max-w-sm font-body">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-start gap-2.5 p-4 rounded-xl border shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-4 backdrop-blur-md ${
              toast.type === 'success' 
                ? 'bg-white border-teal-500/30 text-teal-600' 
                : toast.type === 'error'
                ? 'bg-white border-red-500/30 text-red-600'
                : 'bg-white border-orange-500/30 text-orange-500'
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
