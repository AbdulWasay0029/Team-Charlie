import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export default function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points || points.length === 0) return;

    // Build leaflet.heat overlay layer
    // Each point format: [lat, lng, intensity]
    const heatLayer = L.heatLayer(points, {
      radius: 35,
      blur: 20,
      maxZoom: 18,
      max: 1.0,
      gradient: {
        0.2: 'rgba(59, 130, 246, 0.5)',   // Blue (Low density)
        0.4: 'rgba(6, 182, 212, 0.7)',   // Cyan
        0.6: 'rgba(16, 185, 129, 0.8)',  // Emerald
        0.8: 'rgba(245, 158, 11, 0.9)',  // Amber
        1.0: 'rgba(239, 68, 68, 1.0)'    // Red (Critical Density)
      }
    });

    heatLayer.addTo(map);

    // Clean up on component unmount
    return () => {
      if (map.hasLayer(heatLayer)) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, points]);

  return null;
}
