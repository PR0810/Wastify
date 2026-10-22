import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, Navigation } from 'lucide-react';

export type VehiclePos = {
  driver_id: string;
  driver_name: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  updated_at: string;
};

function truckIcon() {
  return L.divIcon({
    html: '<div style="font-size:24px;transform:translate(-50%,-50%)">🚛</div>',
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function userIcon() {
  return L.divIcon({
    html: '<div style="font-size:20px;transform:translate(-50%,-50%)">📍</div>',
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function VehicleMap({
  vehicles,
  userPos,
  height = '400px',
}: {
  vehicles: VehiclePos[];
  userPos?: { lat: number; lng: number } | null;
  height?: string;
}) {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && vehicles.length > 0) {
      const bounds = L.latLngBounds(vehicles.map((v) => [v.latitude, v.longitude] as [number, number]));
      if (userPos) bounds.extend([userPos.lat, userPos.lng]);
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [vehicles, userPos]);

  const center: [number, number] = vehicles[0]
    ? [vehicles[0].latitude, vehicles[0].longitude]
    : userPos
    ? [userPos.lat, userPos.lng]
    : [20.5937, 78.9629];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200" style={{ height }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={(m) => { mapRef.current = m; }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        {userPos && (
          <Marker position={[userPos.lat, userPos.lng]} icon={userIcon()}>
            <Popup>Your Location</Popup>
          </Marker>
        )}
        {vehicles.map((v) => (
          <Marker key={v.driver_id} position={[v.latitude, v.longitude]} icon={truckIcon()}>
            <Popup>
              <div style={{ minWidth: '140px' }}>
                <p style={{ fontWeight: 600, margin: '0 0 4px 0' }}>{v.driver_name}</p>
                <p style={{ fontSize: '12px', margin: 0 }}>Speed: {v.speed.toFixed(1)} m/s</p>
                <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>
                  {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export function SingleLocationMap({
  latitude,
  longitude,
  label,
  height = '300px',
}: {
  latitude: number;
  longitude: number;
  label?: string;
  height?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200" style={{ height }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        <Marker position={[latitude, longitude]} icon={truckIcon()}>
          {label && <Popup>{label}</Popup>}
        </Marker>
      </MapContainer>
    </div>
  );
}

export function MapPlaceholder({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex h-[300px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon ?? <Navigation className="h-6 w-6" />}
      </div>
      <p className="mt-3 text-sm text-slate-500">{message}</p>
    </div>
  );
}

export { Truck };
