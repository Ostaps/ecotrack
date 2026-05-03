import { useEffect, useState } from 'react';
import { getLiveShipments } from '../api/shipments';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader2, Truck, Plane, Ship, Train, Activity, Navigation, List, X } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { motion, AnimatePresence } from 'framer-motion';

// Component to handle programmatic map flying
function MapFlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], 7, {
        animate: true,
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [target, map]);
  return null;
}

const createCustomIcon = (mode, fuelType, status) => {
  let IconComponent = Truck;
  if (mode === 'AIR') IconComponent = Plane;
  if (mode === 'SEA') IconComponent = Ship;
  if (mode === 'RAIL') IconComponent = Train;

  let colorClass = 'text-red-500';
  let pulseClass = 'pulse-glow-red';
  let bgClass = 'bg-red-100';

  if (fuelType === 'ELECTRIC' || fuelType === 'HYDROGEN') {
    colorClass = 'text-green-500';
    pulseClass = 'pulse-glow-green';
    bgClass = 'bg-green-100';
  } else if (fuelType === 'DIESEL_EURO6') {
    colorClass = 'text-orange-500';
    pulseClass = 'pulse-glow-orange';
    bgClass = 'bg-orange-100';
  }

  // Only pulse if in transit
  if (status !== 'IN_TRANSIT') {
    pulseClass = '';
  }

  const iconMarkup = renderToStaticMarkup(
    <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border-2 ${colorClass.replace('text', 'border')} ${pulseClass}`}>
      <div className={`w-8 h-8 rounded-full ${bgClass} flex items-center justify-center`}>
        <IconComponent className={colorClass} size={18} />
      </div>
    </div>
  );

  return L.divIcon({
    html: iconMarkup,
    className: 'custom-leaflet-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -24]
  });
};

function ShipmentPopupContent({ shipment, onClose }) {
  const map = useMap();

  const handleClose = () => {
    onClose();
    map.closePopup();
  };

  return (
    <div className="relative w-[18rem] overflow-visible">
      <div className="relative rounded-2xl border border-gray-200 bg-white/95 p-4 text-gray-900 shadow-2xl backdrop-blur-md">
        <button
          type="button"
          onClick={handleClose}
          aria-label={`Close details for ${shipment.trackingId}`}
          className="absolute right-3 top-3 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <X size={16} />
        </button>
        <div className="mb-2 flex justify-between items-start pr-8">
          <span className="font-mono text-xs font-bold text-gray-500">{shipment.trackingId}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${shipment.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
            {shipment.status}
          </span>
        </div>
        <div className="mb-3 font-medium text-gray-900">
          {shipment.origin} <span className="mx-1 text-gray-400">&rarr;</span> {shipment.destination}
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-gray-500">Vehicle</div>
            <div className="font-semibold text-gray-900">{shipment.vehicleModel || 'N/A'}</div>
          </div>
          <div>
            <div className="text-gray-500">Payload</div>
            <div className="font-semibold text-gray-900">{shipment.payloadTons} t</div>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-2">
          <span className="text-xs text-gray-500">Est. Carbon</span>
          <span className="font-bold text-green-600">{shipment.calculatedCo2} kg</span>
        </div>
      </div>
      <div className="pointer-events-none absolute left-1/2 top-full h-4 w-4 -translate-x-1/2 -translate-y-2 rotate-45 border-b border-r border-gray-200 bg-white/95 shadow-sm" />
    </div>
  );
}

export default function LiveMap() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCo2, setTotalCo2] = useState(0);
  const [flyTarget, setFlyTarget] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openShipmentId, setOpenShipmentId] = useState(null);

  const fetchData = async () => {
    try {
      const data = await getLiveShipments();
      setShipments(data);
      const co2 = data.reduce((sum, s) => sum + (s.calculatedCo2 || 0), 0);
      setTotalCo2(co2);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchData, 10000);
    const initialLoad = setTimeout(() => {
      void fetchData();
    }, 0);

    return () => {
      clearInterval(interval);
      clearTimeout(initialLoad);
    };
  }, []);

  const getPolylineColor = (fuelType, mode) => {
    if (mode === 'AIR') return '#ef4444'; // red
    if (fuelType === 'ELECTRIC' || fuelType === 'HYDROGEN') return '#22c55e'; // green
    if (fuelType === 'DIESEL_EURO6') return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const handleRouteClick = (s) => {
    setFlyTarget({ lat: s.originLat, lng: s.originLon });
  };

  if (loading && shipments.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-50 overflow-hidden">
      <MapContainer 
        center={[48.85, 10.35]} 
        zoom={5} 
        style={{ width: '100%', height: '100%', zIndex: 0 }}
        zoomControl={false}
      >
        <MapFlyTo target={flyTarget} />
        {/* Light Positron Theme */}
        <TileLayer
          attribution='&copy; OpenStreetMap &copy; CartoDB'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {shipments.map(s => {
          const color = getPolylineColor(s.vehicleFuelType, s.transportMode);
          const positions = [
            [s.originLat, s.originLon],
            [s.destinationLat, s.destinationLon]
          ];
          const isMoving = s.status === 'IN_TRANSIT';
          return (
            <div key={s.id}>
              {/* Main Line */}
              <Polyline 
                positions={positions} 
                pathOptions={{ 
                  color, 
                  weight: 3, 
                  opacity: 0.6 
                }} 
              />
              {/* Animated Dashed Line overlay */}
              {isMoving && (
                <Polyline 
                  positions={positions} 
                  pathOptions={{ 
                    color: '#ffffff', 
                    weight: 3, 
                    dashArray: '10, 20',
                    className: 'animate-dash' 
                  }} 
                />
              )}
              
              <Marker 
                position={[s.originLat, s.originLon]}
                icon={createCustomIcon(s.transportMode, s.vehicleFuelType, s.status)}
                eventHandlers={{
                  popupopen: () => setOpenShipmentId(s.id),
                  popupclose: () => {
                    setOpenShipmentId((currentId) => (currentId === s.id ? null : currentId));
                  }
                }}
              >
                <Popup
                  closeButton={false}
                  autoPan
                  keepInView
                  minWidth={288}
                  maxWidth={288}
                  autoPanPaddingTopLeft={isSidebarOpen ? [360, 32] : [32, 32]}
                  autoPanPaddingBottomRight={[360, 220]}
                >
                  <ShipmentPopupContent
                    shipment={s}
                    onClose={() => setOpenShipmentId((currentId) => (currentId === s.id ? null : currentId))}
                  />
                </Popup>
              </Marker>
            </div>
          );
        })}
      </MapContainer>

      {/* Top Right Stats Overlay */}
      <div className={`absolute right-6 bg-white/90 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-200 z-[400] w-80 text-gray-900 transition-all duration-300 ${openShipmentId ? 'top-28' : 'top-6'}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase">Live Carbon Output</h3>
        </div>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl font-bold text-green-600">{totalCo2.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          <span className="text-gray-500 font-medium">kg CO₂</span>
        </div>
        
        <div className="flex justify-between items-center py-3 border-t border-b border-gray-100 mb-4">
          <span className="text-sm text-gray-600">Active Shipments</span>
          <span className="font-bold text-gray-900">{shipments.length}</span>
        </div>

        <div className="flex items-center justify-between text-xs font-medium text-gray-600">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#22c55e]" /> Clean
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#f97316]" /> Euro-6
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#ef4444]" /> High Emit
          </div>
        </div>
      </div>

      {/* Left Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ x: -350, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -350, opacity: 0 }}
            className="absolute top-6 left-6 bottom-6 w-80 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl z-[400] flex flex-col overflow-hidden"
          >
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2 text-gray-900">
                <List size={20} className="text-green-600" />
                <h3 className="font-bold">Active Routes</h3>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {shipments.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => handleRouteClick(s)}
                  className="bg-white hover:bg-gray-50 border border-gray-100 rounded-xl p-4 cursor-pointer transition-colors shadow-sm group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-gray-500">{s.trackingId}</span>
                    {s.status === 'IN_TRANSIT' && <Activity size={14} className="text-blue-500 animate-pulse" />}
                  </div>
                  <div className="text-sm font-bold text-gray-900 mb-1">
                    {s.origin} <Navigation size={12} className="inline mx-1 text-gray-400 group-hover:text-green-500 transition-colors" /> {s.destination}
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">{s.transportMode}</span>
                    <span className="font-bold text-green-600">{s.calculatedCo2} kg</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Sidebar Button */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute bottom-6 left-6 z-[400] bg-white/90 backdrop-blur-md border border-gray-200 p-3 rounded-full text-gray-600 shadow-xl hover:bg-gray-50 transition-colors"
      >
        <List size={20} />
      </button>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}} />
    </div>
  );
}
