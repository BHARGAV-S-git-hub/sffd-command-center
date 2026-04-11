"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function TacticalMap({ data }: { data: any[] }) {
  // Center of San Francisco
  const sfCenter: [number, number] = [37.7749, -122.4194];

  return (
    <MapContainer 
      center={sfCenter} 
      zoom={12} 
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; CARTO'
      />

      {data.map((zone, idx) => {
        if (!zone.latitude || !zone.longitude) return null;

        const isDeficit = zone.resource_status === 'DEFICIT';
        const markerColor = zone.map_hex_code || '#888888'; 

        return (
          <CircleMarker
            key={idx}
            center={[zone.latitude, zone.longitude]}
            radius={isDeficit ? 12 : 8}
            pathOptions={{ 
              fillColor: markerColor, 
              color: markerColor, 
              fillOpacity: 0.6,
              weight: 2
            }}
          >
            <Popup>
              <div style={{ background: '#0a0a0a', padding: '10px', borderRadius: '8px', border: `1px solid ${markerColor}`, color: '#ededed', fontFamily: 'monospace' }}>
                <strong style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#fff' }}>
                  {zone.district || `BATTALION_${idx + 1}`}
                </strong>
                <span style={{ color: markerColor, fontWeight: 'bold' }}>[{zone.resource_status}]</span><br/>
                <span style={{ color: '#888' }}>Risk Prob:</span> <span style={{ color: '#fff' }}>{zone.risk_score_percent}%</span><br/>
                <span style={{ color: '#888' }}>Time Saved:</span> <span style={{ color: '#32d74b' }}>-{zone.potential_seconds_saved}s</span><br/><br/>
                <span style={{ fontSize: '10px', color: '#ccc', display: 'block', maxWidth: '200px' }}>
                  &gt; {zone.live_recommendation}
                </span>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}