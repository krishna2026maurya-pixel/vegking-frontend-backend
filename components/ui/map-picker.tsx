'use client';

import dynamic from 'next/dynamic';
import { Loader2, Navigation } from 'lucide-react';
import { useState } from 'react';

const MapComponent = dynamic(() => import('./map-component'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full rounded-lg bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-gray-400">
      <Loader2 className="h-8 w-8 animate-spin text-green-500 mb-2" />
      <p className="text-sm font-semibold">Loading Map...</p>
    </div>
  )
});

interface MapPickerProps {
  position: { lat: number; lng: number } | null;
  onPositionChange: (pos: { lat: number; lng: number }) => void;
}

export function MapPicker({ position, onPositionChange }: MapPickerProps) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onPositionChange({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      (err) => {
        setLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError('Location permission denied.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError('Location information unavailable.');
            break;
          case err.TIMEOUT:
            setGeoError('Location request timed out.');
            break;
          default:
            setGeoError('An unknown error occurred.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="relative border border-gray-200 rounded-lg overflow-hidden shadow-inner flex flex-col">
      <MapComponent position={position} onPositionChange={onPositionChange} />
      
      {/* Informational overlay */}
      <div className="absolute top-2 left-2 z-[400] bg-white/90 backdrop-blur px-3 py-1.5 rounded-md text-xs font-bold shadow text-gray-700 pointer-events-none">
        Click or drag to pin location
      </div>

      {/* Geolocation Button */}
      <button 
        type="button" 
        onClick={handleGetCurrentLocation}
        disabled={locating}
        className="absolute top-2 right-2 z-[400] bg-white text-gray-800 hover:text-green-600 shadow-md p-2 rounded-full transition-colors flex items-center justify-center disabled:opacity-70 group"
        title="Use Current Location"
      >
        {locating ? (
          <Loader2 className="h-5 w-5 animate-spin text-green-600" />
        ) : (
          <Navigation className="h-5 w-5 group-hover:fill-green-100" />
        )}
      </button>

      {/* Error Message for Geolocation */}
      {geoError && (
        <div className="absolute bottom-2 left-2 right-2 z-[400] bg-red-100 text-red-700 text-xs font-bold px-3 py-2 rounded-md shadow-sm border border-red-200">
          {geoError}
        </div>
      )}
    </div>
  );
}
