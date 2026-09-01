'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Search, Navigation, CheckCircle2, Loader2, X } from 'lucide-react';
// ─── Types ────────────────────────────────────────────────────────────────────
interface LatLng { lat: number; lng: number; }
interface Props {
  onSelect: (address: string, coords: LatLng) => void;
  onClose: () => void;
  defaultAddress?: string;
}
// ─── Nominatim reverse geocode (OpenStreetMap, free, no key) ─────────────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}
// ─── Nominatim forward search ─────────────────────────────────────────────────
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

async function searchAddress(query: string): Promise<NominatimResult[]> {
  if (!query || query.length < 3) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    return res.json();
  } catch {
    return [];
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MapAddressPicker({ onSelect, onClose, defaultAddress }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [selectedAddress, setSelectedAddress] = useState(defaultAddress || '');
  const [selectedCoords, setSelectedCoords] = useState<LatLng | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const searchTimeout = useRef<any>(null);

  // ── Move marker + reverse geocode ──────────────────────────────────────────
  const moveMarker = useCallback(async (lat: number, lng: number) => {
    if (!markerRef.current || !mapRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], mapRef.current.getZoom() < 15 ? 15 : mapRef.current.getZoom());
    setSelectedCoords({ lat, lng });
    const addr = await reverseGeocode(lat, lng);
    setSelectedAddress(addr);
  }, []);

  // ── Init Leaflet map ────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current || mapRef.current) return;

    // React 18 StrictMode async protection
    if ((mapContainerRef.current as any)._leaflet_id) return;

    (async () => {
      const L = (await import('leaflet')).default;

      // Double-check after async import to prevent React 18 StrictMode / hot-reload race conditions
      if (!mapContainerRef.current || (mapContainerRef.current as any)._leaflet_id || mapRef.current) {
        return;
      }

      // Fix default marker icon paths broken by webpack
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]; // India

      const map = L.map(mapContainerRef.current!, {
        center: DEFAULT_CENTER,
        zoom: 5,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom green marker icon
      const greenIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:32px;height:42px;position:relative;
        ">
          <svg viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26S32 26 32 16C32 7.163 24.837 0 16 0z" fill="#16a34a"/>
            <circle cx="16" cy="16" r="7" fill="white"/>
            <circle cx="16" cy="16" r="4" fill="#16a34a"/>
          </svg>
        </div>`,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
      });

      const marker = L.marker(DEFAULT_CENTER, { draggable: true, icon: greenIcon }).addTo(map);
      mapRef.current = map;
      markerRef.current = marker;
      setMapReady(true);

      // Drag end
      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        setSelectedCoords({ lat: pos.lat, lng: pos.lng });
        const addr = await reverseGeocode(pos.lat, pos.lng);
        setSelectedAddress(addr);
      });

      // Click on map
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setSelectedCoords({ lat, lng });
        const addr = await reverseGeocode(lat, lng);
        setSelectedAddress(addr);
      });
    })();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // ── Import leaflet CSS once ─────────────────────────────────────────────────
  useEffect(() => {
    const id = 'leaflet-css';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  // ── Search with debounce ────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    clearTimeout(searchTimeout.current);
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const results = await searchAddress(searchQuery);
      setSearchResults(results);
      setSearching(false);
    }, 500);
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  // ── Select search result ────────────────────────────────────────────────────
  const handleResultClick = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    moveMarker(lat, lng);
    setSelectedAddress(result.display_name);
    setSearchQuery('');
    setSearchResults([]);
  };

  // ── Use My Location ─────────────────────────────────────────────────────────
  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        moveMarker(coords.latitude, coords.longitude);
        setGeolocating(false);
      },
      () => setGeolocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Confirm ─────────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    if (!selectedAddress || !selectedCoords) return;
    onSelect(selectedAddress, selectedCoords);
    onClose();
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.2s ease' }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        .map-modal { animation: slideUp 0.28s cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      <div className="map-modal bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-950 leading-none">Choose Delivery Location</h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Search, pin or tap on the map</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search area, street, city or landmark…"
                className="w-full pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />

              {/* Dropdown results */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  {searchResults.map((r) => (
                    <button
                      key={r.place_id}
                      onMouseDown={() => handleResultClick(r)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-primary/5 text-left transition-colors border-b border-gray-50 last:border-0"
                    >
                      <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-700 leading-snug line-clamp-2">
                        {r.display_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* GPS button */}
            <button
              onClick={handleGeolocate}
              disabled={geolocating}
              title="Use my current location"
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors disabled:opacity-60"
            >
              {geolocating
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Navigation className="w-4 h-4" />
              }
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="relative flex-1 min-h-[300px] bg-gray-100">
          {!mapReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
              <p className="text-sm font-semibold text-gray-500">Loading map…</p>
            </div>
          )}
          <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />
          {mapReady && (
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm border border-gray-100 pointer-events-none">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Drag pin · Tap to move</p>
            </div>
          )}
        </div>

        {/* Selected Address Preview */}
        <div className="px-4 py-3 bg-gray-50/60 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Selected Location</p>
              <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">
                {selectedAddress || <span className="text-gray-400 font-medium">Tap on map or search to pick a location</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Confirm / Cancel */}
        <div className="px-4 pb-4 pt-2 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedAddress || !selectedCoords}
            className="flex-[2] h-12 rounded-2xl bg-primary text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirm Location
          </button>
        </div>

      </div>
    </div>
  );
}
