import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Map as MapIcon, Truck, Package, BarChart3, FileCheck } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import PageTransition from './components/PageTransition';
import LiveMap from './pages/LiveMap';
import FleetManagement from './pages/FleetManagement';
import ShipmentHub from './pages/ShipmentHub';
import Analytics from './pages/Analytics';
import Compliance from './pages/Compliance';

function AppContent() {
  const location = useLocation();
  
  return (
    <div className="flex h-screen w-full bg-gray-50 font-sans">
      <Toaster position="top-right" />
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col transition-all duration-300">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <MapIcon className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">EcoTrack</h1>
            <p className="text-xs text-gray-500 font-medium tracking-wider">ENTERPRISE</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-6">
          <NavItem to="/map" icon={<MapIcon size={20} />} label="Live Map" />
          <NavItem to="/fleet" icon={<Truck size={20} />} label="Fleet Management" />
          <NavItem to="/shipments" icon={<Package size={20} />} label="Shipment Hub" />
          <NavItem to="/analytics" icon={<BarChart3 size={20} />} label="ESG Analytics" />
          <NavItem to="/compliance" icon={<FileCheck size={20} />} label="Compliance" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50 relative">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Navigate to="/analytics" replace />} />
            <Route path="/map" element={<PageTransition><LiveMap /></PageTransition>} />
            <Route path="/fleet" element={<PageTransition><FleetManagement /></PageTransition>} />
            <Route path="/shipments" element={<PageTransition><ShipmentHub /></PageTransition>} />
            <Route path="/analytics" element={<PageTransition><Analytics /></PageTransition>} />
            <Route path="/compliance" element={<PageTransition><Compliance /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
          isActive 
            ? 'bg-green-50 text-green-700' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export default App;
