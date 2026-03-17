import React, { useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

interface MapTrackerProps {
    driverLocation?: { lat: number; lng: number };
    destination?: { lat: number; lng: number };
    onMapClick?: (lat: number, lng: number) => void;
    readOnly?: boolean;
}

const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '12px'
};


const MapTracker: React.FC<MapTrackerProps> = ({ driverLocation, destination, onMapClick, readOnly = true }) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey || ''
    });

    const onLoad = useCallback(() => {
        // Optional: store map instance if needed
    }, []);

    const onUnmount = useCallback(() => {
        // Cleanup if needed
    }, []);

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (!readOnly && onMapClick && e.latLng) {
            onMapClick(e.latLng.lat(), e.latLng.lng());
        }
    };

    if (!apiKey) {
        return (
            <div className="h-[400px] w-full bg-red-50 border border-red-200 rounded-xl flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-red-600 text-xl font-bold">!</span>
                </div>
                <h3 className="text-red-800 font-semibold mb-1">Google Maps API Key Missing</h3>
                <p className="text-red-600 text-sm max-w-xs">Please add VITE_GOOGLE_MAPS_API_KEY to your frontend/.env file and restart the dev server.</p>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="h-[400px] w-full bg-red-50 border border-red-200 rounded-xl flex flex-col items-center justify-center p-6 text-center">
                <h3 className="text-red-800 font-semibold mb-1">Error Loading Maps</h3>
                <p className="text-red-600 text-sm max-w-xs">{loadError.message}</p>
            </div>
        );
    }

    if (!isLoaded) return <div className="h-[400px] w-full bg-dark-50 animate-pulse rounded-xl flex items-center justify-center text-dark-400 border border-dark-100 shadow-inner">Loading Map...</div>;

    // Determine map center with better defaults (avoiding falsy 0 issues)
    // Priority: Destination > Driver > Default
    const mapCenter = (destination && destination.lat !== 0 && destination.lng !== 0) ? destination :
        (driverLocation && driverLocation.lat !== 0 && driverLocation.lng !== 0) ? driverLocation :
            { lat: 9.0192, lng: 38.7525 }; // Default to Addis Ababa

    return (
        <div className="relative rounded-xl overflow-hidden shadow-md border border-dark-100">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={14}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={handleMapClick}
                options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                    styles: [
                        {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }]
                        }
                    ]
                }}
            >
                {driverLocation && driverLocation.lat !== 0 && driverLocation.lng !== 0 && (
                    <Marker
                        position={{ lat: driverLocation.lat, lng: driverLocation.lng }}
                        icon={{
                            url: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', // More modern delivery truck icon
                            scaledSize: new google.maps.Size(40, 40)
                        }}
                        title="Driver Location"
                    />
                )}
                {destination && destination.lat !== 0 && destination.lng !== 0 && (
                    <Marker
                        position={{ lat: destination.lat, lng: destination.lng }}
                        label={{
                            text: "Destination",
                            className: "bg-white px-2 py-1 rounded shadow-sm text-xs font-bold -mt-10 border border-dark-200",
                        }}
                        title="Delivery Destination"
                    />
                )}
            </GoogleMap>
        </div>
    );
};

export default React.memo(MapTracker);
