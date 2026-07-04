import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CATEGORIES } from '../mockData';
import ReportPopup from './ReportPopup';
import HeatmapLayer from './HeatmapLayer';
import { Layers, ShieldAlert, Zap, Clock, Cpu, Filter } from 'lucide-react';

// Helper to calculate distance in meters between two lat/lng points
const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Group reports within 100 meters
const clusterReports = (reportsList) => {
  if (!reportsList || !Array.isArray(reportsList)) return [];
  const clusters = [];
  const visited = new Set();

  reportsList.forEach((report, idx) => {
    if (visited.has(report.id)) return;
    const cluster = { ...report, clusteredReports: [report] };
    visited.add(report.id);

    for (let i = idx + 1; i < reportsList.length; i++) {
      const other = reportsList[i];
      if (!visited.has(other.id)) {
        const dist = getDistanceMeters(report.lat, report.lng, other.lat, other.lng);
        if (dist <= 100) {
          cluster.clusteredReports.push(other);
          visited.add(other.id);
          if ((other.priority_score || 0) > (cluster.priority_score || 0)) {
            cluster.priority_score = other.priority_score;
          }
        }
      }
    }
    clusters.push(cluster);
  });
  return clusters;
};

// Center map on Hyderabad (default city)
const HYDERABAD_CENTER = [17.3850, 78.4867];

// Custom function to generate stylized divIcon for Leaflet markers
const createCustomIcon = (report) => {
  let pinBgColor = 'bg-emerald-500 border-emerald-400';
  let pulseColor = 'rgba(16, 185, 129, 0.4)';
  let statusBorder = 'border-2';
  let iconEmoji = '📍';
  let animationClass = '';

  // 1. Status specific logic
  if (report.status === 'pending') {
    pinBgColor = 'bg-slate-400 border-slate-300';
    statusBorder = 'border-2 border-dashed';
    pulseColor = 'rgba(148, 163, 184, 0.5)';
    animationClass = 'custom-pin-pulse';
  } else if (report.status === 'in_progress') {
    pinBgColor = 'bg-blue-600 border-blue-400';
    pulseColor = 'rgba(37, 99, 235, 0.6)';
    animationClass = 'animate-pulse';
  } else if (report.status === 'resolved_pending_confirmation') {
    pinBgColor = 'bg-amber-500 border-amber-400';
    pulseColor = 'rgba(245, 158, 11, 0.8)';
    animationClass = 'animate-pulse';
  } else if (report.status === 'resolved') {
    pinBgColor = 'bg-slate-400 border-slate-300 opacity-60';
    pulseColor = 'rgba(148, 163, 184, 0.2)';
  } else if (report.status === 'reopened') {
    pinBgColor = 'bg-red-600 border-red-500';
    pulseColor = 'rgba(239, 68, 68, 0.8)';
    animationClass = 'animate-bounce';
  } else {
    // 2. Score based logic (for live / standard verified tickets)
    const votes = report.priority_score || 0;
    if (votes >= 25) {
      pinBgColor = 'bg-red-600 border-red-500';
      pulseColor = 'rgba(220, 38, 38, 0.6)';
    } else if (votes >= 10) {
      pinBgColor = 'bg-orange-500 border-orange-400';
      pulseColor = 'rgba(249, 115, 22, 0.6)';
    } else {
      pinBgColor = 'bg-emerald-500 border-emerald-400';
      pulseColor = 'rgba(16, 185, 129, 0.6)';
    }
  }

  const catEmoji = CATEGORIES[report.category]?.icon || iconEmoji;
  const count = report.clusteredReports ? report.clusteredReports.length : 1;

  // Dynamic sizing based on AI severity rating
  const severity = report.ai_severity || 5;
  let size = 36;
  let textScale = 'text-base';
  if (severity >= 8) {
    size = 46;
    textScale = 'text-xl';
  } else if (severity <= 3) {
    size = 28;
    textScale = 'text-xs';
  }

  const html = `
    <div class="relative flex items-center justify-center rounded-full ${statusBorder} ${pinBgColor} text-white shadow-xl ${animationClass} select-none transition-all duration-300 hover:scale-110" 
      style="width: ${size}px; height: ${size}px; box-shadow: 0 0 ${severity >= 8 ? '20px 6px' : '12px'} ${pulseColor}; transform: translateY(-4px)">
      <span class="${textScale}">${catEmoji}</span>
      ${count > 1 ? `
        <span class="absolute -top-2 -left-2 bg-indigo-600 text-white font-mono font-black text-[9px] px-1.5 py-0.5 rounded-full shadow border border-white z-10 animate-pulse">
          ${count}
        </span>
      ` : ''}
      ${report.status === 'resolved_pending_confirmation' ? `
        <span class="absolute -top-1 -right-1 flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-leaflet-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
};

// Temp marker for click-to-report action
const clickPinIcon = L.divIcon({
  html: `
    <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-dashed border-orange-500 bg-orange-500/20 text-orange-600 shadow-lg animate-bounce">
      <span class="text-lg font-bold">+</span>
    </div>
  `,
  className: 'click-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// User's Current Location Marker styled as a Google Maps translucent blue ball
const userLocationIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer">
      <div class="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping"></div>
      <div class="absolute w-8 h-8 bg-blue-500/25 rounded-full border border-blue-500/10"></div>
      <div class="w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white shadow-md relative z-10"></div>
    </div>
  `,
  className: 'user-location-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Sub-component to capture map click events
function MapClickEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
}

// Sub-component to auto-zoom to user's location when map opens
function AutoZoomToUser({ userPos }) {
  const map = useMap();
  useEffect(() => {
    if (userPos) {
      map.flyTo(userPos, 15, { duration: 1.5 });
    }
  }, [userPos, map]);
  return null;
}

// Sub-component to fly to a target coordinate programmatically
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

// Custom Zoom Widget (bottom-left)
function CustomZoomWidget() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const widgetRef = useRef(null);

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on('zoomend', onZoom);
    return () => {
      map.off('zoomend', onZoom);
    };
  }, [map]);

  useEffect(() => {
    if (widgetRef.current) {
      L.DomEvent.disableClickPropagation(widgetRef.current);
      L.DomEvent.disableScrollPropagation(widgetRef.current);
    }
  }, []);

  return (
    <div 
      ref={widgetRef}
      className="absolute bottom-24 left-4 z-[1000] flex items-center bg-white border border-slate-205/90 rounded-2xl shadow-xl p-1.5 font-mono font-extrabold text-[12px] text-slate-800 select-none transition-all hover:border-slate-350"
    >
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-center text-sm font-black transition cursor-pointer"
        title="Zoom In"
      >
        +
      </button>
      <span className="px-3.5 text-center min-w-[32px] font-bold text-slate-700 tracking-wider">
        {zoom}
      </span>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-center text-sm font-black transition cursor-pointer"
        title="Zoom Out"
      >
        -
      </button>
    </div>
  );
}

// Sub-component for Unified GIS Control Dock (bottom-right)
function MapToolDock({ userPos, showHeatmap, onToggleHeatmap, onOpenHistory }) {
  const map = useMap();
  const dockRef = useRef(null);

  useEffect(() => {
    if (dockRef.current) {
      L.DomEvent.disableClickPropagation(dockRef.current);
      L.DomEvent.disableScrollPropagation(dockRef.current);
    }
  }, []);

  return (
    <div 
      ref={dockRef}
      className="absolute bottom-8 right-6 z-[1000] flex flex-col gap-2.5 font-body font-bold uppercase tracking-widest text-[9px] select-none"
    >
      {/* 1. Recenter to My Location */}
      <button
        type="button"
        onClick={() => {
          if (userPos) {
            map.flyTo(userPos, 15, { duration: 1.5 });
          }
        }}
        className="p-3 bg-white/95 hover:bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200/80 flex items-center justify-center gap-2 font-extrabold cursor-pointer transition-all duration-200 hover:scale-105 backdrop-blur-md group"
        title="Recenter to My Location"
      >
        <span className="text-base">🧭</span>
        <span className="hidden md:inline font-body">My Location</span>
      </button>

      {/* 2. Toggle Heatmap */}
      <button
        type="button"
        onClick={onToggleHeatmap}
        className={`p-3 rounded-2xl shadow-xl border font-extrabold flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 cursor-pointer backdrop-blur-md ${
          showHeatmap 
            ? 'bg-orange-500 border-transparent text-white shadow-orange-500/30' 
            : 'bg-white/95 hover:bg-white border-slate-200/80 text-slate-800'
        }`}
        title="Density Heatmap Overlay"
      >
        <span className="text-base">🔥</span>
        <span className="hidden md:inline font-body">Heatmap</span>
      </button>

      {/* 3. Open My Reports */}
      <button
        type="button"
        onClick={onOpenHistory}
        className="p-3 bg-white/95 hover:bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200/80 flex items-center justify-center gap-2 font-extrabold cursor-pointer transition-all duration-200 hover:scale-105 backdrop-blur-md"
        title="My Reports History"
      >
        <span className="text-base">📁</span>
        <span className="hidden md:inline font-body">My Reports</span>
      </button>
    </div>
  );
}

export default function MapView({ 
  reports, 
  activeClick, 
  onMapClick, 
  onVote, 
  onConfirmResolution,
  showHeatmap,
  onToggleHeatmap,
  onOpenHistory,
  votedReportIds = [],
  mapCenter = null,
  onOpenImage,
  activeCategoryFilter = 'all',
  onSelectCategoryFilter
}) {
  const [userPos, setUserPos] = useState(HYDERABAD_CENTER);
  const [mapLayer, setMapLayer] = useState('voyager'); // 'voyager' | 'dark' | 'satellite'

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPos([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          setUserPos(HYDERABAD_CENTER);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const clusteredReportsList = clusterReports(reports);

  const heatmapPoints = reports
    .filter(r => r.status !== 'resolved')
    .map(r => [r.lat, r.lng, Math.min(1.0, (r.priority_score || 1) / 25)]);

  // Stats calculation for Top Civic Pulse Ticker
  const escalatedCount = reports.filter(r => (r.priority_score || 0) >= 25 && r.status !== 'resolved').length;
  const totalVotes = reports.reduce((acc, r) => acc + (r.priority_score || 0), 0);

  return (
    <div className="w-full h-full relative z-0 flex flex-col font-body">
      
      {/* 1. TOP CIVIC PULSE TICKER BAR (GIS HUD) */}
      <div 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className="absolute top-4 left-4 right-4 z-[1000] max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-800/90 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-lg text-slate-200 select-none"
      >
        <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
          <div className="flex items-center gap-2 bg-red-950/40 border border-red-900/40 px-3 py-1 rounded-xl text-red-400 font-extrabold animate-pulse">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>🚨 {escalatedCount} Active Escalations</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300 font-bold hidden sm:flex">
            <Zap className="w-4 h-4 text-orange-400" />
            <span>⚡ {totalVotes} Upvotes Cast</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300 font-bold hidden md:flex">
            <Clock className="w-4 h-4 text-teal-400" />
            <span>⏱️ Avg SLA: <strong className="text-white">2.4 Days</strong></span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-400 font-bold hidden lg:flex">
            <Cpu className="w-4 h-4" />
            <span>🤖 TraceSpark AI Sentinel: <strong className="uppercase">Online</strong></span>
          </div>
        </div>

        {/* Tile Layer Switcher Dock */}
        <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl text-[11px] font-mono font-bold">
          <button
            type="button"
            onClick={() => setMapLayer('voyager')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              mapLayer === 'voyager' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Light Street Map"
          >
            ☀️ <span className="hidden sm:inline">Light</span>
          </button>
          <button
            type="button"
            onClick={() => setMapLayer('dark')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              mapLayer === 'dark' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Dark Command Map"
          >
            🌙 <span className="hidden sm:inline">Dark</span>
          </button>
          <button
            type="button"
            onClick={() => setMapLayer('satellite')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              mapLayer === 'satellite' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Satellite Imagery"
          >
            🛰️ <span className="hidden sm:inline">Satellite</span>
          </button>
        </div>
      </div>

      <MapContainer
        center={HYDERABAD_CENTER}
        zoom={13}
        className="w-full h-full flex-1"
        zoomControl={false}
      >
        {/* Dynamic Tile Layer Server */}
        {mapLayer === 'satellite' ? (
          <TileLayer
            attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        ) : mapLayer === 'dark' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
        )}

        {/* Auto Zoom to User Location when Map Opens */}
        <AutoZoomToUser userPos={userPos} />

        {/* Programmatic map recenter hook */}
        <RecenterMap center={mapCenter} />

        {/* Custom Zoom Control Widget (bottom-left) */}
        <CustomZoomWidget />

        {/* Unified GIS Control Dock (bottom-right) */}
        <MapToolDock 
          userPos={userPos} 
          showHeatmap={showHeatmap} 
          onToggleHeatmap={onToggleHeatmap} 
          onOpenHistory={onOpenHistory} 
        />

        {/* Dynamic Density Heatmap Overlay */}
        {showHeatmap && heatmapPoints.length > 0 && (
          <HeatmapLayer points={heatmapPoints} />
        )}

        {/* Capture Map Clicks */}
        <MapClickEvents onMapClick={onMapClick} />

        {/* Render User Current Location Marker */}
        {userPos && (
          <Marker position={userPos} icon={userLocationIcon}>
            <Popup className="custom-popup-window" keepInView={true}>
              <div className="p-2.5 text-center font-body min-w-[160px]">
                <span className="text-2xl block mb-1">🧭</span>
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Your Current Location</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-1 leading-normal">We use your location to verify nearby civic reports and route to your ward councillor.</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render Temp Marker where user clicked to report */}
        {activeClick && (
          <Marker position={[activeClick.lat, activeClick.lng]} icon={clickPinIcon} />
        )}

        {/* Render Report Markers */}
        {clusteredReportsList.map((report) => (
          <Marker
            key={report.id}
            position={[report.lat, report.lng]}
            icon={createCustomIcon(report)}
          >
            <Popup className="custom-popup-window" keepInView={true}>
              <ReportPopup
                report={report}
                onVote={onVote}
                onConfirmResolution={onConfirmResolution}
                hasVoted={votedReportIds.includes(report.id)}
                onOpenImage={onOpenImage}
              />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* 2. INTERACTIVE CATEGORY LEGEND & FILTER DOCK (BOTTOM LEFT) */}
      <div 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className="absolute bottom-4 left-4 z-[1000] bg-slate-900/95 border border-slate-800/90 rounded-2xl p-3 shadow-2xl backdrop-blur-md select-none max-w-[340px] sm:max-w-[480px] text-slate-200 font-body transition-all"
      >
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Filter className="w-3.5 h-3.5 text-orange-400" />
            <span className="uppercase tracking-wider font-display font-black text-[11px]">Civic Hazard Legend & Live Filters</span>
          </div>
          {activeCategoryFilter !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectCategoryFilter && onSelectCategoryFilter('all')}
              className="text-[10px] text-orange-400 hover:text-orange-300 font-mono underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => onSelectCategoryFilter && onSelectCategoryFilter('all')}
            className={`px-2 py-1 rounded-xl text-[10px] font-mono font-extrabold border transition cursor-pointer flex items-center gap-1 ${
              activeCategoryFilter === 'all'
                ? 'bg-orange-500 border-orange-400 text-white shadow-sm'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <span>🌐 All Hazards ({reports.length})</span>
          </button>

          {Object.entries(CATEGORIES).map(([key, cat]) => {
            const count = reports.filter(r => r.category === key).length;
            const isSelected = activeCategoryFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectCategoryFilter && onSelectCategoryFilter(key)}
                className={`px-2 py-1 rounded-xl text-[10px] font-mono font-extrabold border transition cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-orange-500 border-orange-400 text-white shadow-sm scale-105'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
