// Expanded Mock data representing reports for TraceSpark
export const INITIAL_REPORTS = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    user_id: '11111111-1111-1111-1111-111111111111',
    lat: 17.3850,
    lng: 78.4867,
    category: 'garbage',
    description: 'Overflowing garbage dump obstructing the main market road. Urgent health hazard in Charminar ward.',
    photo_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18',
    ai_verified: true,
    ai_severity: 5,
    status: 'live',
    priority_score: 24,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    user_id: '22222222-2222-2222-2222-222222222222',
    lat: 17.4060,
    lng: 78.4680,
    category: 'road_damage',
    description: 'Deep pothole cluster on Road No 36 after recent rainfall. Causing severe traffic jams and vehicle damage.',
    photo_url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2',
    ai_verified: true,
    ai_severity: 4,
    status: 'live',
    priority_score: 18,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    user_id: '11111111-1111-1111-1111-111111111111',
    lat: 17.4480,
    lng: 78.3770,
    category: 'open_drain',
    description: 'Uncovered manhole near Mindspace tech park entrance. Severe pedestrian and two-wheeler hazard.',
    photo_url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9',
    ai_verified: true,
    ai_severity: 4,
    status: 'live',
    priority_score: 7,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    user_id: '22222222-2222-2222-2222-222222222222',
    lat: 17.4100,
    lng: 78.4500,
    category: 'streetlight',
    description: 'Entire row of streetlights non-functional on necklace road stretch. Creating dark safety hazard at night.',
    photo_url: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c',
    ai_verified: true,
    ai_severity: 3,
    status: 'in_progress',
    priority_score: 14,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    user_id: '11111111-1111-1111-1111-111111111111',
    lat: 17.4390,
    lng: 78.4740,
    category: 'water_leak',
    description: 'Major pipeline burst wasting clean drinking water and flooding the main road. Fixed by water board.',
    photo_url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296',
    ai_verified: true,
    ai_severity: 5,
    status: 'resolved',
    priority_score: 31,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
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

export const WARDS_DATABASE = {
  "Ward 112 (Hitech City)": {
    id: "112",
    name: "Hitech City",
    zone: "Serilingampally Zone",
    councillor_name: "Sri Ch. Ram Mohan",
    councillor_phone: "+91 94400 11200",
    councillor_email: "councillor.112@ghmc.gov.in",
    office_address: "GHMC Ward Office, Cyber Towers Rd, Hitech City"
  },
  "Ward 95 (Khairatabad)": {
    id: "95",
    name: "Khairatabad",
    zone: "Khairatabad Zone",
    councillor_name: "Smt. P. Vijaya Lakshmi",
    councillor_phone: "+91 94400 09500",
    councillor_email: "councillor.95@ghmc.gov.in",
    office_address: "GHMC Ward Office, Khairatabad Circle No 17"
  },
  "Ward 80 (Charminar)": {
    id: "80",
    name: "Charminar",
    zone: "Charminar Zone",
    councillor_name: "Sri K. Venkatesh",
    councillor_phone: "+91 94400 08000",
    councillor_email: "councillor.80@ghmc.gov.in",
    office_address: "GHMC Ward Office, Sardar Mahal, Charminar Circle"
  },
  "Ward 101 (Jubilee Hills)": {
    id: "101",
    name: "Jubilee Hills",
    zone: "Serilingampally Zone",
    councillor_name: "Sri V. Krishna Mohan",
    councillor_phone: "+91 94400 10100",
    councillor_email: "councillor.101@ghmc.gov.in",
    office_address: "GHMC Ward Office, Road No. 36, Jubilee Hills"
  },
  "Ward 120 (Kukatpally)": {
    id: "120",
    name: "Kukatpally",
    zone: "Kukatpally Zone",
    councillor_name: "Sri M. Satyanarayana",
    councillor_phone: "+91 94400 12000",
    councillor_email: "councillor.120@ghmc.gov.in",
    office_address: "GHMC Ward Office, JNTU Road, Kukatpally"
  },
  "Ward 85 (Koti)": {
    id: "85",
    name: "Koti",
    zone: "Charminar Zone",
    councillor_name: "Smt. K. Saritha",
    councillor_phone: "+91 94400 08500",
    councillor_email: "councillor.85@ghmc.gov.in",
    office_address: "GHMC Ward Office, Sultan Bazar, Koti"
  },
  "Ward 98 (Gachibowli)": {
    id: "98",
    name: "Gachibowli",
    zone: "Serilingampally Zone",
    councillor_name: "Sri R. Pratap Reddy",
    councillor_phone: "+91 94400 09800",
    councillor_email: "councillor.98@ghmc.gov.in",
    office_address: "GHMC Ward Office, DLF Rd, Gachibowli"
  },
  "Ward 104 (Begumpet)": {
    id: "104",
    name: "Begumpet",
    zone: "Secunderabad Zone",
    councillor_name: "Smt. T. Maheshwari",
    councillor_phone: "+91 94400 10400",
    councillor_email: "councillor.104@ghmc.gov.in",
    office_address: "GHMC Ward Office, Prakash Nagar, Begumpet"
  }
};
