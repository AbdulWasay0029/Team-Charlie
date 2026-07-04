// Expanded Mock data representing reports for Bharat Patrol
export const INITIAL_REPORTS = [
  {
    id: 1,
    user_id: "usr_chaitanya",
    lat: 17.4483,
    lng: 78.3741,
    category: "road_damage",
    description: "Huge pothole in the middle of the road near Hitech City metro station. Causing traffic jams and potential accidents.",
    photo_url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80",
    ai_verified: true,
    ai_severity: "high",
    ai_issue_type: "Deep Asphalt Pothole",
    status: "pending",
    priority_score: 5,
    ward: "Ward 112 (Hitech City)",
    resolution_photo_url: null,
    created_at: "2026-07-04T08:30:00Z"
  },
  {
    id: 2,
    user_id: "usr_anil",
    lat: 17.4065,
    lng: 78.4691,
    category: "open_drain",
    description: "Drainage overflow near Hussain Sagar lake. Bad smell and health hazard for pedestrians.",
    photo_url: "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=600&q=80",
    ai_verified: true,
    ai_severity: "critical",
    ai_issue_type: "Open Sewage Overflow",
    status: "in_progress",
    priority_score: 18,
    ward: "Ward 95 (Khairatabad)",
    resolution_photo_url: null,
    created_at: "2026-07-04T09:15:00Z"
  },
  {
    id: 3,
    user_id: "usr_priya",
    lat: 17.3616,
    lng: 78.4747,
    category: "garbage",
    description: "Huge pile of garbage accumulated near Charminar. Has not been cleared for 4 days.",
    photo_url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80",
    ai_verified: true,
    ai_severity: "medium",
    ai_issue_type: "Overflowing Garbage Dump",
    status: "resolved_pending_confirmation",
    priority_score: 32,
    ward: "Ward 80 (Charminar)",
    resolution_photo_url: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80", // clean street
    created_at: "2026-07-03T10:00:00Z"
  },
  {
    id: 4,
    user_id: "usr_sai",
    lat: 17.4243,
    lng: 78.4497,
    category: "streetlight",
    description: "Streetlights are not working for the entire lane near Jubilee Hills Road No. 36.",
    photo_url: "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&w=600&q=80",
    ai_verified: true,
    ai_severity: "low",
    ai_issue_type: "Dark Street Lane Lights Out",
    status: "reopened",
    priority_score: 27,
    ward: "Ward 101 (Jubilee Hills)",
    resolution_photo_url: null,
    created_at: "2026-07-02T14:20:00Z"
  },
  {
    id: 5,
    user_id: "usr_rahul",
    lat: 17.4834,
    lng: 78.3881,
    category: "water_leak",
    description: "Drinking water pipe burst, wasting thousands of liters of water near Kukatpally.",
    photo_url: "https://images.unsplash.com/photo-1508189860359-777d945909ef?auto=format&fit=crop&w=600&q=80",
    ai_verified: true,
    ai_severity: "high",
    ai_issue_type: "High-pressure Mainline Leak",
    status: "resolved",
    priority_score: 12,
    ward: "Ward 120 (Kukatpally)",
    resolution_photo_url: "https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&w=600&q=80",
    created_at: "2026-07-01T11:00:00Z"
  },
  {
    id: 6,
    user_id: "usr_karthik",
    lat: 17.3850,
    lng: 78.4867,
    category: "fallen_tree",
    description: "A large Neem tree fell during yesterday's storm, blocking half the road in Koti.",
    photo_url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80",
    ai_verified: true,
    ai_severity: "medium",
    ai_issue_type: "Fallen Tree Blocking Lane",
    status: "live",
    priority_score: 8,
    ward: "Ward 85 (Koti)",
    resolution_photo_url: null,
    created_at: "2026-07-04T06:00:00Z"
  },
  {
    id: 7,
    user_id: "usr_divya",
    lat: 17.4320,
    lng: 78.4580,
    category: "encroachment",
    description: "Vendors have constructed permanent stalls occupying the complete footpath outside Begumpet Railway Station. Pedestrians forced to walk on main road.",
    photo_url: "https://images.unsplash.com/photo-1536647249037-37597eceab53?auto=format&fit=crop&w=600&q=80",
    ai_verified: true,
    ai_severity: "high",
    ai_issue_type: "Commercial Footpath Encroachment",
    status: "live",
    priority_score: 26, // Hits WhatsApp alert threshold (25+ votes)
    ward: "Ward 104 (Begumpet)",
    resolution_photo_url: null,
    created_at: "2026-07-04T05:00:00Z"
  }
];

export const CATEGORIES = {
  road_damage: { label: "Road Damage", icon: "🛣️", color: "red", desc: "Potholes, cracks, broken tarmac" },
  open_drain: { label: "Open Drain", icon: "🕳️", color: "yellow", desc: "Dengue + malaria breeding ground" },
  streetlight: { label: "Streetlight Out", icon: "💡", color: "blue", desc: "Women's safety, night accidents" },
  garbage: { label: "Garbage Pile", icon: "🗑️", color: "green", desc: "Overflowing bins, illegal dumping" },
  water_leak: { label: "Water Leakage", icon: "💧", color: "cyan", desc: "Wastage + road damage combo" },
  encroachment: { label: "Encroachment", icon: "🚧", color: "purple", desc: "Footpath blocked, pedestrian risk" },
  fallen_tree: { label: "Fallen Tree", icon: "🌳", color: "emerald", desc: "Post-rain emergency hazard" },
  bus_stop: { label: "Bus Stop Issue", icon: "🚌", color: "indigo", desc: "Broken shelter, missing benches" }
};

export const STATUS_OPTIONS = [
  { value: "pending", label: "Pending Verification" },
  { value: "live", label: "Live Complaints" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved_pending_confirmation", label: "Pending Citizen Confirmation" },
  { value: "resolved", label: "Resolved" },
  { value: "reopened", label: "Reopened" },
  { value: "rejected", label: "Rejected" }
];

export const MOCK_LEADERBOARD = [
  { rank: 1, name: "Chaitanya Reddy", ward: "Ward 112 (Hitech City)", points: 480, reportsCount: 22, badges: ["🏆 Savior", "🚨 QuickReporter"] },
  { rank: 2, name: "Priya Sharma", ward: "Ward 80 (Charminar)", points: 410, reportsCount: 18, badges: ["🎯 Accurate", "🛡️ Guardian"] },
  { rank: 3, name: "Anil Kumar", ward: "Ward 95 (Khairatabad)", points: 350, reportsCount: 15, badges: ["🔍 Detective"] },
  { rank: 4, name: "Sai Teja", ward: "Ward 101 (Jubilee Hills)", points: 290, reportsCount: 12, badges: ["🌱 EcoWarrior"] },
  { rank: 5, name: "Divya N", ward: "Ward 104 (Begumpet)", points: 240, reportsCount: 10, badges: [] }
];
