// Expanded Mock data representing reports for Bharat Patrol
export const INITIAL_REPORTS = [];

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
