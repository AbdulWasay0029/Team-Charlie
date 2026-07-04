import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { CATEGORIES } from '../mockData';
import ReportPopup from './ReportPopup';
import HeatmapLayer from './HeatmapLayer';

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
    pinBgColor = 'bg-slate-700/80 border-slate-400';
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
    pinBgColor = 'bg-slate-600 border-slate-500 opacity-60';
    pulseColor = 'rgba(100, 116, 139, 0.2)';
  } else if (report.status === 'reopened') {
    pinBgColor = 'bg-red-700 border-red-500';
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

  // Get specific category emoji
  const catEmoji = CATEGORIES[report.category]?.icon || iconEmoji;

  const html = `
    <div class="relative flex items-center justify-center w-9 h-9 rounded-full ${statusBorder} ${pinBgColor} text-white shadow-xl ${animationClass} select-none transition-all duration-300 hover:scale-110" style="box-shadow: 0 0 12px ${pulseColor}; transform: translateY(-4px)">
      <span class="text-base">${catEmoji}</span>
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
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

// Temp marker for click-to-report action
const clickPinIcon = L.divIcon({
  html: `
    <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-dashed border-orange-500 bg-orange-500/20 text-orange-500 shadow-lg animate-bounce">
      <span class="text-lg font-bold">+</span>
    </div>
  `,
  className: 'click-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
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

export default function MapView({ 
  reports, 
  activeClick, 
  onMapClick, 
  onVote, 
  onConfirmResolution,
  showHeatmap 
}) {
  // Compute points for the density heatmap overlay
  // Format: [lat, lng, intensity] where intensity is determined by priority score (upvotes)
  const heatmapPoints = reports
    .filter(r => r.status !== 'resolved')
    .map(r => [r.lat, r.lng, Math.min(1.0, (r.priority_score || 1) / 25)]);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={HYDERABAD_CENTER}
        zoom={13}
        className="w-full h-full"
        zoomControl={false}
      >
        {/* OpenStreetMap Dark Styled Tile Server */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Dynamic Density Heatmap Overlay */}
        {showHeatmap && heatmapPoints.length > 0 && (
          <HeatmapLayer points={heatmapPoints} />
        )}

        {/* Capture Map Clicks */}
        <MapClickEvents onMapClick={onMapClick} />

        {/* Render Temp Marker where user clicked to report */}
        {activeClick && (
          <Marker position={[activeClick.lat, activeClick.lng]} icon={clickPinIcon} />
        )}

        {/* Render Report Markers (Only when heatmap is not active, or together. Usually rendering them together or hiding markers to see heat is perfect. Let's render markers on top of heatmap so citizens can click on hot spots!) */}
        {reports.map((report) => (
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
              />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Instructions Banner (Bottom Left) */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-xl py-2 px-3 shadow-xl z-[1000] text-xs pointer-events-none select-none max-w-[280px]">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-orange-500 animate-ping"></div>
          <p className="text-slate-300 font-bold">Hackathon Mode</p>
        </div>
        <p className="text-slate-400 mt-1 leading-normal font-medium text-left">
          Tap anywhere on the map to file a live complaint. Active filters are visible on markers.
        </p>
      </div>
    </div>
  );
}
