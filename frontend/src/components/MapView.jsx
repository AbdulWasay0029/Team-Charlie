import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CATEGORIES } from '../mockData';
import ReportPopup from './ReportPopup';
import HeatmapLayer from './HeatmapLayer';
import { Layers } from 'lucide-react';

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
function MapToolDock({ userPos, showHeatmap, onToggleHeatmap, onOpenHistory, mapLayer, setMapLayer }) {
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

      {/* 4. Switch Map Layer */}
      <button
        type="button"
        onClick={() => {
          if (mapLayer === 'voyager') setMapLayer('dark');
          else if (mapLayer === 'dark') setMapLayer('satellite');
          else setMapLayer('voyager');
        }}
        className="p-3 bg-white/95 hover:bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200/80 flex items-center justify-center gap-2 font-extrabold cursor-pointer transition-all duration-200 hover:scale-105 backdrop-blur-md"
        title="Switch Map Style (Light / Dark / Satellite)"
      >
        <span className="text-base">{mapLayer === 'voyager' ? '☀️' : mapLayer === 'dark' ? '🌙' : '🛰️'}</span>
        <span className="hidden md:inline font-body">
          {mapLayer === 'voyager' ? 'Light Map' : mapLayer === 'dark' ? 'Dark Map' : 'Satellite'}
        </span>
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
    <div className="w-full h-full relative z-0 flex flex-col flex-1 font-body">
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
          mapLayer={mapLayer}
          setMapLayer={setMapLayer}
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

      {/* Floating Instructions Banner (Bottom Left) */}
      <div 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className="absolute bottom-4 left-4 bg-white border border-slate-200 rounded-xl py-2 px-3 shadow-xl z-[1000] text-xs select-none max-w-[280px] text-slate-700 font-body"
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-orange-500 animate-ping"></div>
          <p className="text-slate-800 font-bold">Grievance Map Mode</p>
        </div>
        <p className="text-slate-500 mt-1 leading-normal text-left font-medium">
          Tap anywhere on the map to drop a new complaint pin.
        </p>
      </div>
    </div>
  );
}
