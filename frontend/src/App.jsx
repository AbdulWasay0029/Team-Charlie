import React, { useState, useEffect } from 'react';
import MapView from './components/MapView';
import FilterBar from './components/FilterBar';
import ReportForm from './components/ReportForm';
import SidePanel from './components/SidePanel';
import AuthModal from './components/AuthModal';
import LegalModal from './components/LegalModal';
import CouncillorDashboard from './components/CouncillorDashboard';
import ChatWidget from './components/ChatWidget';
import TransparencyPage from './components/TransparencyPage';
import ImageLightbox from './components/ImageLightbox';
import { INITIAL_REPORTS, CATEGORIES, WARDS_DATABASE } from './mockData';
import { 
  AlertCircle, CheckCircle2, Info, RefreshCw, X, Shield, 
  Map, Award, Flame, User, LogOut, MessageSquare, AlertOctagon, History, Loader2,
  Send, Mic, Bell, Settings, ArrowRight, Folder, MapPin, CheckCircle, Clock, ChevronRight, Sparkles, SendHorizontal, AlertTriangle,
  BarChart3, Sun, Moon
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
  const [filters, setFilters] = useState({ category: 'all', status: 'active' });
  const [sortBy, setSortBy] = useState('priority');
  
  // Theme state & handler
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      document.documentElement.classList.add('light');
      return false;
    } else {
      document.documentElement.classList.remove('light');
      return true;
    }
  });

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newVal = !prev;
      if (newVal) {
        document.documentElement.classList.remove('light');
        localStorage.setItem('theme', 'dark');
        showToast("Theme switched to Dark Command Mode", "success");
      } else {
        document.documentElement.classList.add('light');
        localStorage.setItem('theme', 'light');
        showToast("Theme switched to Light Clean Mode", "success");
      }
      return newVal;
    });
  };
  
  // Navigation View State: 'dashboard' or 'map'
  const [viewMode, setViewMode] = useState('dashboard');
  
  // Modals & Panels State
  const [activeClick, setActiveClick] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  
  // Interactive Overlays
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [escalationAlert, setEscalationAlert] = useState(null); // holds report details when 25 votes hit
  const [lightboxData, setLightboxData] = useState(null);
  
  // Signup State (Reads from LocalStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('tracespark_user') || localStorage.getItem('bharat_patrol_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [councillorUser, setCouncillorUser] = useState(() => {
    const saved = localStorage.getItem('bharat_patrol_councillor');
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

  // Legal & Compliance Modal States
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState('tos'); // 'tos'|'privacy'|'licenses'|'ai'|'rti'

  // AI Chatbot State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: "Namaste! How can I help you today?" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [activeFormCategory, setActiveFormCategory] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);

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
        const reportsArray = Array.isArray(data) ? data : [];
        
        // Safeguard Leaflet rendering from crash by removing records with invalid coordinates
        const validReports = reportsArray.filter(r => r && r.lat !== undefined && r.lat !== null && r.lng !== undefined && r.lng !== null && !isNaN(r.lat) && !isNaN(r.lng));
        
        // Map database fields to UI keys
        const mapped = validReports.map(r => ({
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
      if (authMetadata.role === 'councillor') {
        const councillorObj = {
          id: authMetadata.id,
          name,
          phone,
          ward: authMetadata.ward
        };
        localStorage.setItem('bharat_patrol_councillor', JSON.stringify(councillorObj));
        setCouncillorUser(councillorObj);
        setCurrentUser(null);
        setIsAuthModalOpen(false);
        showToast(`Councillor Access Granted: ${name}`, "success");
        setSignupLoading(false);
        return;
      }

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

  const handleCouncillorLogout = () => {
    localStorage.removeItem('bharat_patrol_councillor');
    setCouncillorUser(null);
    showToast("Logged out of Councillor Portal", "info");
  };

  // Handle map click
  const handleMapClick = (latlng) => {
    setActiveClick(latlng);
    setShowForm(true);
  };

  // Perform actual report submission logic (expects valid citizen/user id)
  const executeReportSubmitWithUser = async (formData, userId) => {
    // 1. Proximity check (30m radius) to prevent duplicate submissions
    const getDistanceMeters = (lat1, lng1, lat2, lng2) => {
      const R = 6371000; // Radius of Earth in meters
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const duplicate = reports.find(r => {
      if (r.status === 'resolved' || r.status === 'rejected') return false;
      if (r.category !== formData.category) return false;
      const distance = getDistanceMeters(formData.lat, formData.lng, r.lat, r.lng);
      return distance <= 30; // 30 meters
    });

    if (duplicate) {
      showToast(`A similar ${CATEGORIES[formData.category]?.label || formData.category} has already been reported here. Redirecting you to upvote it!`, "warning");
      setViewMode('map');
      setMapCenter([duplicate.lat, duplicate.lng]);
      setShowForm(false);
      setActiveClick(null);
      setActiveFormCategory(null);
      return;
    }

    const tempLocalId = Date.now();
    showToast("Analyzing photo evidence via Llama Vision...", "info");

    try {
      if (IS_MOCK_MODE) {
        setTimeout(() => {
          const newMockReport = {
            id: tempLocalId,
            user_id: userId,
            reporter_name: currentUser?.name ? `${currentUser.name} (Verified Citizen)` : 'Verified Citizen',
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
            reporter_name: reportRow.reporter_name || (currentUser?.name ? `${currentUser.name} (Verified Citizen)` : 'Verified Citizen'),
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
  const handleSendMessage = async (e, customQuery = null) => {
    if (e) e.preventDefault();
    
    const queryToUse = customQuery || chatInput;
    if (!queryToUse.trim()) return;

    const userMsg = queryToUse.trim();
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
    
    let matchStatus = true;
    if (filters.status === 'active') {
      // Hide fully resolved complaints from default active view
      matchStatus = r.status !== 'resolved';
    } else if (filters.status !== 'all') {
      matchStatus = r.status === filters.status;
    }
    
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

  if (councillorUser) {
    return (
      <>
        <CouncillorDashboard 
          councillor={councillorUser} 
          onLogout={handleCouncillorLogout} 
          showToast={showToast} 
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          onOpenImage={(data) => setLightboxData(data)}
        />
        {lightboxData && (
          <ImageLightbox
            {...lightboxData}
            onClose={() => setLightboxData(null)}
          />
        )}
      </>
    );
  }

  if (viewMode === 'transparency') {
    return (
      <TransparencyPage 
        onClose={() => setViewMode('dashboard')} 
      />
    );
  }

  return (
    <div className={`w-screen h-screen relative flex flex-col select-none overflow-x-hidden overflow-y-auto font-body transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* 1. APP TOP BAR (THEME AWARE & TACTILE) */}
      <header className={`border-b px-6 py-4 flex items-center justify-between shrink-0 shadow-sm sticky top-0 z-[1010] backdrop-blur-md transition-all duration-300 ${
        darkMode 
          ? 'bg-slate-900/85 border-slate-800/85 text-slate-100' 
          : 'bg-white/85 border-slate-200/80 text-slate-900'
      }`}>
        <div className="flex items-center gap-3">
          <img 
            src="/logo.jpeg" 
            alt="TraceSpark" 
            onClick={() => setViewMode('dashboard')}
            className="w-10 h-10 rounded-xl object-cover shadow-md select-none cursor-pointer transition-transform duration-200 active:scale-95"
          />
          <div className="text-left cursor-pointer group" onClick={() => setViewMode('dashboard')}>
            <h1 className="font-display font-extrabold text-xl leading-none tracking-tight bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent group-hover:from-orange-400 group-hover:to-red-500 transition-all">
              TraceSpark
            </h1>
            <p className={`text-[10px] tracking-wider uppercase font-extrabold mt-0.5 transition-colors ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>AI Civic Accountability Loop</p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleDarkMode}
            className={`border p-2.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center shadow-2xs active:scale-[0.98] ${
              darkMode 
                ? 'bg-slate-850 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
            }`}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="h-4.5 w-4.5 text-orange-400" /> : <Moon className="h-4.5 w-4.5 text-indigo-600" />}
          </button>

          <button 
            onClick={() => showToast("No new urgent notifications", "info")}
            className={`border p-2.5 rounded-xl transition-all duration-200 relative cursor-pointer active:scale-[0.98] ${
              darkMode 
                ? 'bg-slate-850 border-slate-800 text-slate-300 hover:bg-slate-800' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="SLA Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </button>
          
          <button 
            onClick={() => setIsSidePanelOpen(true)}
            className={`border p-2.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.98] ${
              darkMode 
                ? 'bg-slate-850 border-slate-800 text-slate-300 hover:bg-slate-800' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="Settings & History"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>

          {/* User Details / Sign Up Trigger */}
          {currentUser ? (
            <div className={`flex items-center gap-3 pl-3 border-l ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="hidden sm:flex flex-col text-right">
                <span className={`text-xs font-extrabold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Namaste, {currentUser.name}</span>
                <span className="text-[9px] text-teal-500 font-mono font-bold tracking-wider uppercase">Verified Citizen</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-950/30 border border-red-900/40 text-red-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-900/40 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setAuthModalTab('signin'); setIsAuthModalOpen(true); }}
                className={`font-mono font-extrabold text-xs uppercase tracking-wider py-2 px-3.5 rounded-xl transition-all duration-200 cursor-pointer shadow-2xs border active:scale-[0.98] ${
                  darkMode 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthModalTab('signup'); setIsAuthModalOpen(true); }}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-mono font-extrabold text-xs uppercase tracking-wider py-2 px-3.5 rounded-xl transition-all duration-200 cursor-pointer shadow-sm border-0 active:scale-[0.98]"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. DYNAMIC BROADCAST WEATHER/ALERTS TICKER */}
      <div className={`py-2.5 px-6 overflow-hidden flex items-center shrink-0 border-b transition-all duration-300 ${
        darkMode 
          ? 'bg-slate-900/90 text-slate-350 border-slate-800/80' 
          : 'bg-teal-900 text-teal-100 border-teal-950/10'
      }`}>
        <div className={`font-mono text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded shrink-0 select-none mr-4 border flex items-center gap-1.5 transition-all duration-300 ${
          darkMode ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/40' : 'bg-teal-950/50 text-teal-200 border-teal-400/30'
        }`}>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          TraceSpark Alert
        </div>
        <div className="relative w-full flex items-center overflow-hidden">
          <div className={`animate-marquee whitespace-nowrap text-xs font-mono font-bold tracking-wider flex gap-12 transition-all duration-300 ${
            darkMode ? 'text-slate-300' : 'text-teal-100'
          }`}>
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

      {/* 3. MAIN DASHBOARD CONTENT (CIVIC CONTROL ROOM) */}
      {viewMode === 'dashboard' ? (
        <div className="flex-1 w-full flex flex-col justify-between">
          <main className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Section A: Hero / Namaste Citizen Greeting Card */}
          <div className="flex flex-col md:flex-row items-stretch gap-5">
            
            <div className={`flex-1 border rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 ${
              darkMode 
                ? 'bg-slate-900/90 border-slate-800/80 shadow-xl text-slate-100' 
                : 'bg-white border-slate-200/80 shadow-sm text-slate-900'
            }`}>
              <div className="flex items-center gap-4 text-left">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm shrink-0 border transition-all ${
                  darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
                }`}>
                  👋
                </div>
                <div>
                  <h2 className="font-display font-black text-2xl md:text-3xl leading-none flex flex-wrap items-center gap-2.5">
                    <span className={darkMode ? 'text-slate-100' : 'text-slate-900'}>
                      Namaste, {currentUser ? currentUser.name : "Citizen (Guest)"}
                    </span>
                    {currentUser?.verified && (
                      <span className={`border text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full shadow-2xs ${
                        darkMode ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        ✓ {currentUser.loginType === 'google' ? 'Google Verified' : 'OTP Verified'}
                      </span>
                    )}
                  </h2>
                  <p className={`font-mono text-xs tracking-wider mt-2 font-bold ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {currentUser ? `${currentUser.email || `+91 •••••• ${currentUser.phone.slice(-4)}`} • Verified Citizen` : "Guest Access Mode • Verification Required to Cast Upvotes"}
                  </p>
                </div>
              </div>
              
              <div className={`border rounded-2xl py-2.5 px-4 text-right shadow-2xs select-none shrink-0 transition-all ${
                darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <span className="text-[10px] text-teal-500 font-extrabold block uppercase tracking-widest">{weatherData.city}</span>
                <span className={`font-mono font-black text-lg flex items-center justify-end gap-1.5 mt-0.5 ${darkMode ? 'text-slate-200' : 'text-slate-850'}`}>
                  ☁️ {weatherData.temp}
                </span>
              </div>
            </div>

            {/* Quick Action CTA Button */}
            <button
              onClick={() => setViewMode('map')}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-mono font-extrabold px-8 py-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] shadow-lg hover:shadow-orange-500/20 shrink-0 md:w-64 text-sm uppercase tracking-widest border-0 cursor-pointer"
            >
              <Map className="h-5 w-5 animate-pulse text-white shrink-0" />
              <span>Open Live Map</span>
            </button>
          </div>

          {/* Section B: Platform Objective & National Crisis Scale */}
          <div className={`p-6 border rounded-2xl space-y-5 text-left shadow-xs transition-all ${
            darkMode 
              ? 'bg-slate-900/90 border-slate-800 text-slate-100' 
              : 'bg-white border-slate-200/80 text-slate-850 shadow-sm'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className={`text-xs font-mono tracking-widest font-extrabold uppercase flex items-center gap-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-800'
              }`}>
                <Sparkles className="h-4 w-4 text-orange-500 shrink-0" />
                <span>India's First AI-Powered Civic Accountability Gateway</span>
              </h3>
              <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded border font-bold ${
                darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                GHMC SLA Enforcement
              </span>
            </div>

            <p className={`text-sm md:text-base font-medium leading-relaxed max-w-[80ch] ${
              darkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
              "Last year, 10,476 Indians died due to preventable potholes and road hazards. Traditional portals are black boxes without SLA enforcement. TraceSpark bridges citizen crowdsourcing, autonomous Llama 3.2 Vision AI inspection, and automated 25-vote WhatsApp/Email dispatches directly to municipal officers."
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 font-mono text-center">
              <div className={`p-4 border rounded-xl shadow-2xs transition-all ${
                darkMode ? 'bg-slate-950 border-red-950/50 text-red-400' : 'bg-red-50/50 border-red-200 text-red-600'
              }`}>
                <span className="font-black text-xl md:text-2xl block">10,476</span>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5 block">Pothole Deaths/Yr</span>
              </div>
              <div className={`p-4 border rounded-xl shadow-2xs transition-all ${
                darkMode ? 'bg-slate-950 border-red-950/50 text-red-400' : 'bg-red-50/50 border-red-200 text-red-600'
              }`}>
                <span className="font-black text-xl md:text-2xl block">3.5L km</span>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5 block">Damaged Roads</span>
              </div>
              <div className={`p-4 border rounded-xl shadow-2xs transition-all ${
                darkMode ? 'bg-slate-950 border-emerald-950/50 text-emerald-400' : 'bg-emerald-50/50 border-emerald-200 text-emerald-700'
              }`}>
                <span className="font-black text-xl md:text-2xl block">100%</span>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5 block">AI Vision Check</span>
              </div>
              <div className={`p-4 border rounded-xl shadow-2xs transition-all ${
                darkMode ? 'bg-slate-950 border-teal-950/50 text-teal-400' : 'bg-teal-50/50 border-teal-200 text-teal-700'
              }`}>
                <span className="font-black text-xl md:text-2xl block">25 Votes</span>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5 block">Auto-Escalation</span>
              </div>
            </div>
          </div>

          {/* Section C: Quick Stats Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className={`border rounded-2xl p-5 flex items-center justify-between shadow-xs hover:shadow-md transition-all ${
              darkMode ? 'bg-slate-900/90 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200/80 text-slate-900'
            }`}>
              <div className="text-left">
                <span className="text-3xl font-black font-mono block leading-none">{statsTotal}</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block mt-1.5">Total Reports</span>
              </div>
              <div className={`p-3 rounded-xl border transition-all ${
                darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <Folder className="h-5 w-5" />
              </div>
            </div>

            <div className={`border rounded-2xl p-5 flex items-center justify-between shadow-xs hover:shadow-md transition-all ${
              darkMode ? 'bg-slate-900/90 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200/80 text-slate-900'
            }`}>
              <div className="text-left">
                <span className="text-3xl font-black font-mono block leading-none">{statsPending}</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block mt-1.5">AI Pending</span>
              </div>
              <div className={`p-3 rounded-xl border transition-all ${
                darkMode ? 'bg-orange-955/30 border-orange-900/40 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-600'
              }`}>
                <Clock className="h-5 w-5" />
              </div>
            </div>

            <div className={`border rounded-2xl p-5 flex items-center justify-between shadow-xs hover:shadow-md transition-all ${
              darkMode ? 'bg-slate-900/90 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200/80 text-slate-900'
            }`}>
              <div className="text-left">
                <span className="text-3xl font-black font-mono block leading-none">{statsInProgress}</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block mt-1.5">Work Orders Dispatch</span>
              </div>
              <div className={`p-3 rounded-xl border transition-all ${
                darkMode ? 'bg-blue-955/30 border-blue-900/40 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'
              }`}>
                <RefreshCw className="h-5 w-5" />
              </div>
            </div>

            <div className={`border rounded-2xl p-5 flex items-center justify-between shadow-xs hover:shadow-md transition-all ${
              darkMode ? 'bg-slate-900/90 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200/80 text-slate-900'
            }`}>
              <div className="text-left">
                <span className="text-3xl font-black font-mono block leading-none">{statsLive}</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block mt-1.5">Live Verified</span>
              </div>
              <div className={`p-3 rounded-xl border transition-all ${
                darkMode ? 'bg-teal-955/30 border-teal-900/40 text-teal-400' : 'bg-teal-50 border-teal-200 text-teal-600'
              }`}>
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>

          </div>

          {/* Section D: Civic Control Room Bento Grid (Featured Services) */}
          <div className="space-y-4">
            <h3 className={`text-xs font-mono font-extrabold uppercase tracking-widest flex items-center gap-2 text-left ${
              darkMode ? 'text-slate-300' : 'text-slate-800'
            }`}>
              <Sparkles className="h-4 w-4 text-orange-500 shrink-0" />
              <span>Civic Control Room & Featured Portals</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
              
              {/* Bento Card 1: Lodge Hazard with AI Vision (2 Cols, 2 Rows on Desktop) */}
              <div 
                onClick={() => setViewMode('map')}
                className="md:col-span-2 lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-orange-600 via-red-600 to-red-700 text-white p-6 md:p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden border border-red-400/30 min-h-[280px]"
              >
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:bg-white/15 transition-all"></div>
                
                <div className="flex items-start justify-between z-10">
                  <div className="bg-white/15 p-3.5 rounded-2xl backdrop-blur-md border border-white/20 text-white font-black text-2xl shadow-sm">
                    🚨
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold bg-white/20 px-3 py-1 rounded-full border border-white/25 shadow-2xs">
                    Primary Action
                  </span>
                </div>

                <div className="text-left z-10 mt-8 space-y-2">
                  <h4 className="font-display font-black text-xl md:text-2xl tracking-tight leading-snug">
                    LODGE HAZARD WITH AI VISION
                  </h4>
                  <p className="text-orange-100 text-xs md:text-sm font-medium leading-relaxed max-w-[45ch]">
                    Attach photographic evidence of potholes, open drains, or garbage accumulation. Our autonomous Llama 3.2 Vision AI inspects the hazard in real-time, grades public safety risk (1–10), and verifies authenticity before pinning it live.
                  </p>
                </div>

                <div className="pt-6 border-t border-white/15 flex items-center justify-between flex-wrap gap-2 font-mono text-[10px] text-white/90 z-10 font-bold">
                  <span>🤖 100% Llama Vision Checked</span>
                  <span>📍 GPS Centroid Routing</span>
                  <span>⚡ 25-Vote SLA Trigger</span>
                </div>
              </div>

              {/* Bento Card 2: Live GIS Grievance Map (2 Cols) */}
              <div 
                onClick={() => { setViewMode('map'); setShowHeatmap(false); }}
                className="md:col-span-1 lg:col-span-2 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden border border-blue-400/30 min-h-[180px]"
              >
                <div className="flex items-start justify-between z-10">
                  <div className="bg-white/15 p-3 rounded-xl backdrop-blur-md border border-white/20 text-white">
                    <Map className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold bg-white/20 px-3 py-1 rounded-full border border-white/25">
                    Map Explorer
                  </span>
                </div>

                <div className="text-left z-10 mt-4">
                  <h4 className="font-display font-black text-lg md:text-xl tracking-tight">
                    LIVE GIS GRIEVANCE MAP
                  </h4>
                  <p className="text-blue-100 text-xs mt-1 font-medium leading-relaxed max-w-[50ch]">
                    Browse live community grievances across 8 canonical Hyderabad municipal wards. Inspect photographic evidence, check SLA countdown timers, and cast upvotes to trigger executive dispatches.
                  </p>
                </div>
              </div>

              {/* Bento Card 3: Neglect Density Heatmap (1 Col) */}
              <div 
                onClick={() => { setViewMode('map'); setShowHeatmap(true); }}
                className={`${darkMode ? 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50 text-slate-100' : 'bg-white border-slate-200 hover:border-amber-500 text-slate-900'} p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 cursor-pointer flex flex-col justify-between group border min-h-[180px]`}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl border transition-all ${darkMode ? 'bg-amber-950/30 border-amber-900/40 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600'}`}>
                    <Flame className="h-6 w-6 animate-pulse" />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded border border-slate-700/30 text-slate-400">
                    Hotspots
                  </span>
                </div>

                <div className="text-left mt-4">
                  <h4 className="font-display font-black text-base tracking-tight">
                    DENSITY HEATMAP
                  </h4>
                  <p className={`text-xs mt-1 font-medium leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Pinpoint critical hubs of civic neglect across Greater Hyderabad based on crowdsourced citizen upvotes.
                  </p>
                </div>
              </div>

              {/* Bento Card 4: SLA Transparency Portal (1 Col) */}
              <div 
                onClick={() => setViewMode('transparency')}
                className={`${darkMode ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50 text-slate-100' : 'bg-white border-slate-200 hover:border-emerald-500 text-slate-900'} p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 cursor-pointer flex flex-col justify-between group border min-h-[180px]`}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl border transition-all ${darkMode ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded border border-slate-700/30 text-slate-400">
                    Accountability
                  </span>
                </div>

                <div className="text-left mt-4">
                  <h4 className="font-display font-black text-base tracking-tight">
                    TRANSPARENCY PORTAL
                  </h4>
                  <p className={`text-xs mt-1 font-medium leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Public accountability leaderboards without black-box bureaucracy. Track ward resolution rates and RTI Act compliance.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Section E: All Services Grid */}
          <div className="space-y-4 pt-2">
            <h3 className={`text-xs font-mono font-extrabold uppercase tracking-widest flex items-center gap-2 text-left ${
              darkMode ? 'text-slate-300' : 'text-slate-800'
            }`}>
              <span>📂 All Municipal Services & Portals</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div 
                onClick={() => setViewMode('map')}
                className={`border p-5 rounded-2xl text-left cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between h-40 ${
                  darkMode ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-100' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                }`}
              >
                <div className={`p-3 rounded-xl border w-fit ${darkMode ? 'bg-red-955/30 border-red-900/40 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wide">Raise Grievance</h4>
                  <p className={`text-xs mt-1 leading-relaxed font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Lodge and track citizen complaints with inline photo verification.</p>
                </div>
              </div>

              <div 
                onClick={() => setViewMode('map')}
                className={`border p-5 rounded-2xl text-left cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between h-40 ${
                  darkMode ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-100' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                }`}
              >
                <div className={`p-3 rounded-xl border w-fit ${darkMode ? 'bg-blue-955/30 border-blue-900/40 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                  <Map className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wide">Grievance Map</h4>
                  <p className={`text-xs mt-1 leading-relaxed font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Interactive map pins, SLA timers, and municipal dispatch status.</p>
                </div>
              </div>

              <div 
                onClick={() => { setViewMode('map'); setShowHeatmap(true); }}
                className={`border p-5 rounded-2xl text-left cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between h-40 ${
                  darkMode ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-100' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                }`}
              >
                <div className={`p-3 rounded-xl border w-fit ${darkMode ? 'bg-orange-955/30 border-orange-900/40 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-600'}`}>
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wide">Neglect Heatmap</h4>
                  <p className={`text-xs mt-1 leading-relaxed font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Hot-spot density overlay coordinates across 8 Hyderabad zones.</p>
                </div>
              </div>

              <div 
                onClick={() => setIsSidePanelOpen(true)}
                className={`border p-5 rounded-2xl text-left cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between h-40 ${
                  darkMode ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-100' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                }`}
              >
                <div className={`p-3 rounded-xl border w-fit ${darkMode ? 'bg-purple-955/30 border-purple-900/40 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-600'}`}>
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wide">Grievance History</h4>
                  <p className={`text-xs mt-1 leading-relaxed font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Track your historical submissions, upvotes, and resolution proofs.</p>
                </div>
              </div>

              <div 
                onClick={() => setViewMode('transparency')}
                className={`border p-5 rounded-2xl text-left cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between h-40 ${
                  darkMode ? 'bg-slate-900/90 border-emerald-900/40 hover:border-emerald-500/50 text-slate-100' : 'bg-white border-emerald-200 hover:border-emerald-500 text-slate-900'
                }`}
              >
                <div className={`p-3 rounded-xl border w-fit ${darkMode ? 'bg-emerald-955/30 border-emerald-900/40 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wide">Transparency Portal</h4>
                  <p className={`text-xs mt-1 leading-relaxed font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>View ward leaderboards, response times, and SLA statistics.</p>
                </div>
              </div>

              <div 
                onClick={() => showToast("Circular manual matched for ward operations guidelines", "info")}
                className={`border p-5 rounded-2xl text-left cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between h-40 ${
                  darkMode ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-100' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                }`}
              >
                <div className={`p-3 rounded-xl border w-fit ${darkMode ? 'bg-teal-955/30 border-teal-900/40 text-teal-400' : 'bg-teal-50 border-teal-200 text-teal-600'}`}>
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wide">My Ward Office</h4>
                  <p className={`text-xs mt-1 leading-relaxed font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Circular manuals, Zonal Commissioner contacts, and emergency numbers.</p>
                </div>
              </div>

            </div>
          </div>
        </main>

        {/* 4. AUTHORITATIVE MUNICIPAL & LEGAL FOOTER (100% EDGE-TO-EDGE) */}
        <footer className="w-full bg-slate-950 text-slate-300 pt-12 pb-16 px-6 sm:px-12 border-t border-slate-800 shadow-2xl font-body shrink-0 mt-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800/80 text-left">
            
            {/* Col 1: Brand & Mission */}
            <div className="md:col-span-1 space-y-3">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setViewMode('dashboard')}>
                <img src="/logo.jpeg" alt="TraceSpark" className="w-9 h-9 rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform" />
                <span className="font-display font-extrabold text-lg text-white tracking-tight">TraceSpark</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                India's first AI-Powered Civic Accountability & SLA Enforcement Gateway. Bridging citizen crowdsourcing, Llama 3.2 Vision inspection, and automated 25-vote SLA dispatches for Greater Hyderabad Municipal Corporation (GHMC).
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] text-teal-400 font-mono font-bold">
                <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse"></span>
                <span>All 8 Municipal Gateways Online</span>
              </div>
            </div>

            {/* Col 2: Municipal & RTI */}
            <div className="space-y-3 text-xs">
              <h4 className="font-mono text-[11px] uppercase tracking-widest text-slate-400 font-extrabold">Municipal & Legal</h4>
              <ul className="space-y-2.5 font-medium text-slate-300">
                <li><button onClick={() => { setLegalModalTab('rti'); setIsLegalModalOpen(true); }} className="hover:text-white transition cursor-pointer text-left">Right to Information (RTI Act 2005)</button></li>
                <li><button onClick={() => { setLegalModalTab('rti'); setIsLegalModalOpen(true); }} className="hover:text-white transition cursor-pointer text-left">GHMC Citizen Charter & SLAs</button></li>
                <li><button onClick={() => { setLegalModalTab('tos'); setIsLegalModalOpen(true); }} className="hover:text-white transition cursor-pointer text-left">Public Grievance Policy (CPGRAMS)</button></li>
                <li><button onClick={() => { setLegalModalTab('privacy'); setIsLegalModalOpen(true); }} className="hover:text-white transition cursor-pointer text-left">GPS Ward Proximity Math</button></li>
              </ul>
            </div>

            {/* Col 3: Legal, Terms & Privacy */}
            <div className="space-y-3 text-xs">
              <h4 className="font-mono text-[11px] uppercase tracking-widest text-slate-400 font-extrabold">Compliance & Terms</h4>
              <ul className="space-y-2.5 font-medium text-slate-300">
                <li><button onClick={() => { setLegalModalTab('tos'); setIsLegalModalOpen(true); }} className="hover:text-white transition cursor-pointer text-left">Terms of Service (ToS)</button></li>
                <li><button onClick={() => { setLegalModalTab('privacy'); setIsLegalModalOpen(true); }} className="hover:text-white transition cursor-pointer text-left">Privacy Policy (DPDP Act 2023)</button></li>
                <li><button onClick={() => { setLegalModalTab('privacy'); setIsLegalModalOpen(true); }} className="hover:text-white transition cursor-pointer text-left">Google OAuth 2.0 Security</button></li>
                <li><button onClick={() => { setLegalModalTab('tos'); setIsLegalModalOpen(true); }} className="hover:text-white transition cursor-pointer text-left">Anti-Spam & Vote Integrity</button></li>
              </ul>
            </div>

            {/* Col 4: Open Source & AI Licenses */}
            <div className="space-y-3 text-xs">
              <h4 className="font-mono text-[11px] uppercase tracking-widest text-slate-400 font-extrabold">Licenses & AI</h4>
              <ul className="space-y-2.5 font-medium text-slate-300">
                <li><button onClick={() => { setLegalModalTab('licenses'); setIsLegalModalOpen(true); }} className="hover:text-white transition cursor-pointer text-left">MIT License (Core Platform)</button></li>
                <li><button onClick={() => { setLegalModalTab('ai'); setIsLegalModalOpen(true); }} className="hover:text-white transition cursor-pointer text-left">Meta Llama 3.2 Community License</button></li>
                <li><button onClick={() => { setLegalModalTab('licenses'); setIsLegalModalOpen(true); }} className="hover:text-white transition cursor-pointer text-left">OpenStreetMap / ODbL GIS Data</button></li>
                <li><button onClick={() => { setLegalModalTab('ai'); setIsLegalModalOpen(true); }} className="hover:text-white transition cursor-pointer text-left">Autonomous Vision Grading</button></li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar: Copyright & Credits */}
          <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
            <div>
              © 2026 TraceSpark Civic Technologies Inc. Built for Greater Hyderabad Municipal Corporation (GHMC). All rights reserved.
            </div>
            <div className="flex items-center gap-2.5 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-slate-400 text-[11px]">
              <span>Designed & Developed by</span>
              <span className="bg-teal-600 text-white font-extrabold px-2 py-0.5 rounded text-[10px] tracking-wider">TEAM CHARLIE</span>
              <span className="font-bold text-slate-300">TraceSpark AI Civic Loop</span>
            </div>
          </div>
        </footer>

      </div>
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
            mapCenter={mapCenter}
            onOpenImage={(data) => setLightboxData(data)}
            activeCategoryFilter={filters.category}
            onSelectCategoryFilter={(cat) => setFilters(prev => ({ ...prev, category: cat }))}
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
        onOpenImage={(data) => setLightboxData(data)}
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
          darkMode={darkMode}
        />
      )}

      {/* 8.5 LEGAL & COMPLIANCE MODAL */}
      {isLegalModalOpen && (
        <LegalModal
          initialTab={legalModalTab}
          onClose={() => setIsLegalModalOpen(false)}
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

      {/* Floating AI Chatbot Widget */}
      <ChatWidget 
        chatMessages={chatMessages}
        chatLoading={chatLoading}
        chatInput={chatInput}
        setChatInput={setChatInput}
        onSendMessage={handleSendMessage}
        onChatAction={handleChatAction}
        showToast={showToast}
      />

      {/* 10. IMAGE LIGHTBOX MODAL */}
      {lightboxData && (
        <ImageLightbox
          {...lightboxData}
          onClose={() => setLightboxData(null)}
        />
      )}

    </div>
  );
}
