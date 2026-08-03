'use client';

import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '0.5rem'
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090
};

interface MapComponentProps {
  position: { lat: number; lng: number } | null;
  onPositionChange: (pos: { lat: number; lng: number }) => void;
}

export default function MapComponent({ position, onPositionChange }: MapComponentProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      onPositionChange({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
    }
  };

  if (!isLoaded) {
    return (
      <div className="h-[300px] w-full rounded-lg bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-green-500 mb-2" />
        <p className="text-sm font-semibold">Loading Map...</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={position || defaultCenter}
      zoom={13}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
      }}
    >
      {position && (
        <Marker 
          position={position} 
          draggable={true}
          onDragEnd={handleMapClick}
        />
      )}
    </GoogleMap>
  );
}
