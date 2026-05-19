import { useState, useEffect } from 'react';
import { getShipments, createShipment, getShipmentDetail, compareShipmentScenarios } from '../api/shipments';
import { getVehicles } from '../api/vehicles';
import { Loader2, Plus, Filter, ChevronRight, Calculator, Truck, Info, GitCompareArrows } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import Drawer from '../components/Drawer';

export default function ShipmentHub() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [comparisonError, setComparisonError] = useState('');
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);

  // Modal & Drawer State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [shipmentDetail, setShipmentDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    originLat: '',
    originLon: '',
    destinationLat: '',
    destinationLon: '',
    distanceKm: '',
    payloadTons: '',
    transportMode: 'ROAD',
    vehicleId: ''
  });

  const [scenarioForm, setScenarioForm] = useState([
    { scenarioId: 'scenario-1', origin: '', destination: '', distanceKm: '', payloadTons: '', transportMode: 'ROAD', vehicleId: '' },
    { scenarioId: 'scenario-2', origin: '', destination: '', distanceKm: '', payloadTons: '', transportMode: 'ROAD', vehicleId: '' }
  ]);

  const fetchData = () => {
    setLoading(true);
    getShipments().then(res => {
      setData(res.content || res);
      setLoading(false);
    });
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchData();
    getVehicles(0, 100).then(res => setVehicles(res.content || res));
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    try {
      await createShipment({
        ...formData,
        originLat: parseFloat(formData.originLat),
        originLon: parseFloat(formData.originLon),
        destinationLat: parseFloat(formData.destinationLat),
        destinationLon: parseFloat(formData.destinationLon),
        distanceKm: parseFloat(formData.distanceKm),
        payloadTons: parseFloat(formData.payloadTons),
        vehicleId: formData.vehicleId || null
      });
      toast.success('Shipment created successfully!');
      setIsAddModalOpen(false);
      setStatusFilter('ALL');
      fetchData();
    } catch {
      toast.error('Failed to create shipment');
    }
  };

  const filteredData = statusFilter === 'ALL' ? data : data.filter(row => row.status === statusFilter);

  const updateScenario = (index, field, value) => {
    setScenarioForm(prev => prev.map((scenario, i) => i === index ? { ...scenario, [field]: value } : scenario));
  };

  const compareScenarios = async () => {
    setComparisonError('');
    setComparisonResult(null);

    const hasMissing = scenarioForm.some(
      s => !s.origin || !s.destination || !s.distanceKm || !s.payloadTons || !s.vehicleId || !s.transportMode
    );
    if (hasMissing) {
      setComparisonError('Complete all scenario fields before comparing.');
      return;
    }

    const payload = {
      scenarios: scenarioForm.map((s, index) => ({
        scenarioId: s.scenarioId || `scenario-${index + 1}`,
        origin: s.origin,
        destination: s.destination,
        distanceKm: Number(s.distanceKm),
        payloadTons: Number(s.payloadTons),
        transportMode: s.transportMode,
        vehicleId: s.vehicleId
      }))
    };

    setComparisonLoading(true);
    try {
      const result = await compareShipmentScenarios(payload);
      setComparisonResult(result);
    } catch (error) {
      setComparisonError(error?.response?.data?.message || 'Failed to compare scenarios.');
    } finally {
      setComparisonLoading(false);
    }
  };

  const handleRowClick = async (row) => {
    setSelectedShipment(row);
    setIsDrawerOpen(true);
    setDetailLoading(true);
    try {
      const detail = await getShipmentDetail(row.id);
      setShipmentDetail(detail);
    } catch {
      toast.error('Failed to load details');
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      IN_TRANSIT: 'bg-blue-100 text-blue-700',
      PENDING: 'bg-amber-100 text-amber-700',
      DELIVERED: 'bg-green-100 text-green-700',
      DELAYED: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getModeBadge = (mode) => {
    const styles = {
      ROAD: 'text-orange-600',
      RAIL: 'text-blue-600',
      SEA: 'text-teal-600',
      AIR: 'text-red-600'
    };
    return <span className={`font-medium text-sm ${styles[mode]}`}>{mode}</span>;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Shipment Hub</h1>
          <p className="text-gray-500">Track and manage active routes and calculated emissions.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#22c55e] hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Create Shipment
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative inline-block">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 rounded-lg border border-gray-200 focus:outline-none appearance-none bg-white font-medium text-gray-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="PENDING">Pending</option>
              <option value="DELIVERED">Delivered</option>
              <option value="DELAYED">Delayed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-green-500" /></div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Tracking ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Route</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Mode</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Distance</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Payload</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">CO2 Est.</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.map(row => (
                  <tr key={row.id} onClick={() => handleRowClick(row)} className="hover:bg-white hover:shadow-md hover:scale-[1.002] transition-all duration-200 cursor-pointer bg-white group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-transparent">{row.trackingId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 bg-transparent">{row.origin} &rarr; {row.destination}</td>
                    <td className="px-6 py-4 whitespace-nowrap bg-transparent">{getStatusBadge(row.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap bg-transparent">{getModeBadge(row.transportMode)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-transparent">{row.distanceKm} km</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-transparent">{row.payloadTons} t</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 text-right bg-transparent">{row.calculatedCo2} kg</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right bg-transparent">
                      <ChevronRight size={18} className="text-gray-400 group-hover:text-green-500 transition-colors inline-block" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredData.length && (
              <div className="p-8 text-center text-sm text-gray-500 border-t border-gray-100">
                No shipments match the selected status.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <GitCompareArrows size={18} className="text-green-600" />
              Green Route Advisor v1
            </h2>
            <p className="text-sm text-gray-500">Estimated values only. Final emissions are recorded after shipment creation.</p>
          </div>
          <button
            type="button"
            onClick={compareScenarios}
            className="bg-[#22c55e] hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Compare Scenarios
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {scenarioForm.map((scenario, index) => (
            <div key={scenario.scenarioId} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-3">Scenario {index + 1}</h3>
              <div className="space-y-2">
                <input
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                  placeholder="Origin"
                  value={scenario.origin}
                  onChange={e => updateScenario(index, 'origin', e.target.value)}
                />
                <input
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                  placeholder="Destination"
                  value={scenario.destination}
                  onChange={e => updateScenario(index, 'destination', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    placeholder="Distance km"
                    value={scenario.distanceKm}
                    onChange={e => updateScenario(index, 'distanceKm', e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    placeholder="Payload tons"
                    value={scenario.payloadTons}
                    onChange={e => updateScenario(index, 'payloadTons', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white"
                    value={scenario.transportMode}
                    onChange={e => updateScenario(index, 'transportMode', e.target.value)}
                  >
                    <option value="ROAD">Road</option>
                    <option value="RAIL">Rail</option>
                    <option value="SEA">Sea</option>
                    <option value="AIR">Air</option>
                  </select>
                  <select
                    className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white"
                    value={scenario.vehicleId}
                    onChange={e => updateScenario(index, 'vehicleId', e.target.value)}
                  >
                    <option value="">Select vehicle</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.model} ({v.fuelType})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {comparisonError && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-3">{comparisonError}</div>
        )}
        {comparisonLoading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" /> Comparing scenarios...
          </div>
        )}
        {comparisonResult && (
          <div className="mt-4">
            <div className="text-sm text-gray-700 mb-2">
              Preferred rule: <span className="font-medium">{comparisonResult.preferredRule}</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {comparisonResult.scenarios.map((scenario) => (
                <div key={scenario.scenarioId} className={`rounded-lg border p-3 ${scenario.scenarioId === comparisonResult.preferredScenarioId ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-medium text-gray-900">{scenario.scenarioId}</div>
                    {scenario.scenarioId === comparisonResult.preferredScenarioId && <span className="text-xs font-semibold text-green-700">Preferred</span>}
                  </div>
                  <div className="text-sm text-gray-600">{scenario.origin} → {scenario.destination}</div>
                  <div className="text-sm text-gray-700 mt-1">CO2 (Estimated): <span className="font-semibold text-green-700">{scenario.estimatedCo2Kg} kg</span></div>
                  <div className="text-xs text-gray-500 mt-1">Method: {scenario.methodologyVersion}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Shipment Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Shipment">
        <form onSubmit={handleCreateShipment} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origin City</label>
              <input required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination City</label>
              <input required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origin Lat</label>
              <input required type="number" step="0.0001" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.originLat} onChange={e => setFormData({...formData, originLat: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origin Lon</label>
              <input required type="number" step="0.0001" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.originLon} onChange={e => setFormData({...formData, originLon: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dest Lat</label>
              <input required type="number" step="0.0001" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.destinationLat} onChange={e => setFormData({...formData, destinationLat: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dest Lon</label>
              <input required type="number" step="0.0001" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.destinationLon} onChange={e => setFormData({...formData, destinationLon: e.target.value})} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
              <input required type="number" step="0.1" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.distanceKm} onChange={e => setFormData({...formData, distanceKm: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payload (Tons)</label>
              <input required type="number" step="0.1" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.payloadTons} onChange={e => setFormData({...formData, payloadTons: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transport Mode</label>
            <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 bg-white" value={formData.transportMode} onChange={e => setFormData({...formData, transportMode: e.target.value})}>
              <option value="ROAD">Road</option>
              <option value="RAIL">Rail</option>
              <option value="SEA">Sea</option>
              <option value="AIR">Air</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Vehicle</label>
            <select required className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 bg-white" value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})}>
              <option value="" disabled>Select a vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.model} ({v.fuelType})</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors">Create Shipment</button>
          </div>
        </form>
      </Modal>

      {/* Shipment Details Drawer */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Shipment Overview">
        {selectedShipment && (
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Total Carbon Impact</div>
                <div className="text-3xl font-bold text-green-700">{selectedShipment.calculatedCo2} <span className="text-lg">kg</span></div>
              </div>
              <Calculator className="text-green-300 w-12 h-12" />
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Route Details</h4>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div className="text-gray-500">Tracking ID</div>
                <div className="font-mono text-gray-900">{selectedShipment.trackingId}</div>
                <div className="text-gray-500">Status</div>
                <div>{getStatusBadge(selectedShipment.status)}</div>
                <div className="text-gray-500">Origin</div>
                <div className="font-medium text-gray-900">{selectedShipment.origin}</div>
                <div className="text-gray-500">Destination</div>
                <div className="font-medium text-gray-900">{selectedShipment.destination}</div>
                <div className="text-gray-500">Distance</div>
                <div className="font-medium text-gray-900">{selectedShipment.distanceKm} km</div>
                <div className="text-gray-500">Payload</div>
                <div className="font-medium text-gray-900">{selectedShipment.payloadTons} t</div>
              </div>
            </div>

            {detailLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-green-500" /></div>
            ) : shipmentDetail ? (
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
                  <Truck className="text-gray-400" size={18} />
                  <h4 className="font-bold text-gray-900">Vehicle Assigned</h4>
                </div>
                <div className="grid grid-cols-2 gap-y-3 text-sm mb-4">
                  <div className="text-gray-500">Model</div>
                  <div className="font-medium">{shipmentDetail.vehicleModel}</div>
                  <div className="text-gray-500">Fuel Type</div>
                  <div className="font-medium text-green-700">{shipmentDetail.vehicleFuelType}</div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Info className="text-blue-500" size={14} />
                    <span className="text-xs font-bold text-gray-700">GLEC Formula Applied</span>
                  </div>
                  <code className="text-xs text-gray-600 block bg-white p-2 rounded border border-gray-200">
                    E = Distance × Payload × EF
                  </code>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Drawer>
    </div>
  );
}
