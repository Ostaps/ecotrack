import { useEffect, useState } from 'react';
import { compareShipmentScenarios, createShipment, getShipmentDetail, getShipments } from '../api/shipments';
import { getVehicles } from '../api/vehicles';
import { Loader2, Plus, Filter, ChevronRight, Calculator, Truck, Info, GitCompare, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import Drawer from '../components/Drawer';

const buildShipmentForm = () => ({
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

const buildScenario = (label) => ({
  scenarioLabel: label,
  ...buildShipmentForm()
});

const buildInitialScenarios = () => [
  buildScenario('Scenario A'),
  buildScenario('Scenario B')
];

const toScenarioPayload = (scenario) => ({
  scenarioLabel: scenario.scenarioLabel,
  origin: scenario.origin,
  destination: scenario.destination,
  originLat: Number.parseFloat(scenario.originLat),
  originLon: Number.parseFloat(scenario.originLon),
  destinationLat: Number.parseFloat(scenario.destinationLat),
  destinationLon: Number.parseFloat(scenario.destinationLon),
  distanceKm: Number.parseFloat(scenario.distanceKm),
  payloadTons: Number.parseFloat(scenario.payloadTons),
  transportMode: scenario.transportMode,
  vehicleId: scenario.vehicleId || null
});

export default function ShipmentHub() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [shipmentDetail, setShipmentDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [formData, setFormData] = useState(buildShipmentForm());
  const [comparisonScenarios, setComparisonScenarios] = useState(buildInitialScenarios());
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState('');

  const fetchData = () => {
    setLoading(true);
    getShipments()
      .then((res) => {
        setData(res.content || res);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;

    getShipments()
      .then((res) => {
        if (!active) {
          return;
        }
        setData(res.content || res);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setLoading(false);
        }
      });

    getVehicles(0, 100).then((res) => {
      if (active) {
        setVehicles(res.content || res);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    try {
      await createShipment({
        ...formData,
        originLat: Number.parseFloat(formData.originLat),
        originLon: Number.parseFloat(formData.originLon),
        destinationLat: Number.parseFloat(formData.destinationLat),
        destinationLon: Number.parseFloat(formData.destinationLon),
        distanceKm: Number.parseFloat(formData.distanceKm),
        payloadTons: Number.parseFloat(formData.payloadTons),
        vehicleId: formData.vehicleId || null
      });
      toast.success('Shipment created successfully!');
      setIsAddModalOpen(false);
      setFormData(buildShipmentForm());
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create shipment');
    }
  };

  const handleRowClick = async (row) => {
    setSelectedShipment(row);
    setShipmentDetail(null);
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

  const handleScenarioChange = (index, field, value) => {
    setComparisonScenarios((current) =>
      current.map((scenario, scenarioIndex) =>
        scenarioIndex === index ? { ...scenario, [field]: value } : scenario
      )
    );
  };

  const handleAddScenario = () => {
    if (comparisonScenarios.length >= 4) {
      return;
    }
    const nextLabel = `Scenario ${String.fromCharCode(65 + comparisonScenarios.length)}`;
    setComparisonScenarios((current) => [...current, buildScenario(nextLabel)]);
  };

  const handleRemoveScenario = (index) => {
    if (comparisonScenarios.length <= 2) {
      return;
    }
    setComparisonScenarios((current) => current.filter((_, scenarioIndex) => scenarioIndex !== index));
  };

  const resetComparisonState = () => {
    setComparisonScenarios(buildInitialScenarios());
    setComparisonResult(null);
    setComparisonError('');
    setComparisonLoading(false);
  };

  const openCompareModal = () => {
    resetComparisonState();
    setIsCompareModalOpen(true);
  };

  const closeCompareModal = () => {
    setIsCompareModalOpen(false);
    resetComparisonState();
  };

  const handleCompareScenarios = async (e) => {
    e.preventDefault();
    setComparisonLoading(true);
    setComparisonError('');
    setComparisonResult(null);

    try {
      const result = await compareShipmentScenarios({
        scenarios: comparisonScenarios.map(toScenarioPayload)
      });
      setComparisonResult(result);
    } catch (err) {
      const message = err?.response?.data?.message || 'Scenario comparison failed.';
      setComparisonError(message);
    } finally {
      setComparisonLoading(false);
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
      <div className="flex justify-between items-end mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Shipment Hub</h1>
          <p className="text-gray-500">Track and manage active routes and calculated emissions.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={openCompareModal}
            className="bg-white hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors border border-gray-200"
          >
            <GitCompare size={18} /> Compare Scenarios
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#22c55e] hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={18} /> Create Shipment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative inline-block">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select className="pl-10 pr-8 py-2 rounded-lg border border-gray-200 focus:outline-none appearance-none bg-white font-medium text-gray-700">
              <option>All Statuses</option>
              <option>In Transit</option>
              <option>Pending</option>
              <option>Delivered</option>
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
                {data.map((row) => (
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
          </div>
        )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Shipment">
        <form onSubmit={handleCreateShipment} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origin City</label>
              <input required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.origin} onChange={(e) => setFormData({ ...formData, origin: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination City</label>
              <input required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origin Lat</label>
              <input required type="number" step="0.0001" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.originLat} onChange={(e) => setFormData({ ...formData, originLat: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origin Lon</label>
              <input required type="number" step="0.0001" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.originLon} onChange={(e) => setFormData({ ...formData, originLon: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dest Lat</label>
              <input required type="number" step="0.0001" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.destinationLat} onChange={(e) => setFormData({ ...formData, destinationLat: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dest Lon</label>
              <input required type="number" step="0.0001" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.destinationLon} onChange={(e) => setFormData({ ...formData, destinationLon: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
              <input required type="number" step="0.1" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.distanceKm} onChange={(e) => setFormData({ ...formData, distanceKm: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payload (Tons)</label>
              <input required type="number" step="0.1" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.payloadTons} onChange={(e) => setFormData({ ...formData, payloadTons: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transport Mode</label>
            <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 bg-white" value={formData.transportMode} onChange={(e) => setFormData({ ...formData, transportMode: e.target.value })}>
              <option value="ROAD">Road</option>
              <option value="RAIL">Rail</option>
              <option value="SEA">Sea</option>
              <option value="AIR">Air</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Vehicle</label>
            <select required className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 bg-white" value={formData.vehicleId} onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}>
              <option value="" disabled>Select a vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>{vehicle.model} ({vehicle.fuelType})</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors">Create Shipment</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isCompareModalOpen} onClose={closeCompareModal} title="Green Route Advisor v1">
        <form onSubmit={handleCompareScenarios} className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">Compare 2 to 4 planning scenarios. Results are estimates only and do not create shipments.</p>
              <p className="text-xs text-gray-500 mt-1">Ranking order: lowest CO2, then shortest distance, then scenario label.</p>
            </div>
            <button
              type="button"
              onClick={handleAddScenario}
              disabled={comparisonScenarios.length >= 4}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Scenario
            </button>
          </div>

          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            {comparisonScenarios.map((scenario, index) => (
              <div key={`${scenario.scenarioLabel}-${index}`} className="rounded-xl border border-gray-200 p-4 bg-gray-50/60">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scenario Label</label>
                    <input
                      required
                      type="text"
                      value={scenario.scenarioLabel}
                      onChange={(e) => handleScenarioChange(index, 'scenarioLabel', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 bg-white"
                    />
                  </div>
                  {comparisonScenarios.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveScenario(index)}
                      className="mt-6 inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <X size={16} /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Origin City</label>
                    <input required type="text" value={scenario.origin} onChange={(e) => handleScenarioChange(index, 'origin', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination City</label>
                    <input required type="text" value={scenario.destination} onChange={(e) => handleScenarioChange(index, 'destination', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Origin Lat</label>
                    <input required type="number" step="0.0001" value={scenario.originLat} onChange={(e) => handleScenarioChange(index, 'originLat', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Origin Lon</label>
                    <input required type="number" step="0.0001" value={scenario.originLon} onChange={(e) => handleScenarioChange(index, 'originLon', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dest Lat</label>
                    <input required type="number" step="0.0001" value={scenario.destinationLat} onChange={(e) => handleScenarioChange(index, 'destinationLat', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dest Lon</label>
                    <input required type="number" step="0.0001" value={scenario.destinationLon} onChange={(e) => handleScenarioChange(index, 'destinationLon', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
                    <input required type="number" step="0.1" value={scenario.distanceKm} onChange={(e) => handleScenarioChange(index, 'distanceKm', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payload (Tons)</label>
                    <input required type="number" step="0.1" value={scenario.payloadTons} onChange={(e) => handleScenarioChange(index, 'payloadTons', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 bg-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transport Mode</label>
                    <select value={scenario.transportMode} onChange={(e) => handleScenarioChange(index, 'transportMode', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 bg-white">
                      <option value="ROAD">Road</option>
                      <option value="RAIL">Rail</option>
                      <option value="SEA">Sea</option>
                      <option value="AIR">Air</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Vehicle</label>
                    <select value={scenario.vehicleId} onChange={(e) => handleScenarioChange(index, 'vehicleId', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 bg-white">
                      <option value="">Select a vehicle</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>{vehicle.model} ({vehicle.fuelType})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {comparisonLoading && (
            <div className="flex items-center justify-center gap-2 p-4 text-sm text-gray-600 border border-gray-200 rounded-xl">
              <Loader2 className="w-4 h-4 animate-spin text-green-500" />
              Calculating estimated emissions...
            </div>
          )}

          {!comparisonLoading && comparisonError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {comparisonError}
            </div>
          )}

          {!comparisonLoading && !comparisonResult && !comparisonError && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500 text-center">
              Add complete planning inputs for each scenario, then run the comparison to see estimated CO2 side by side.
            </div>
          )}

          {comparisonResult && (
            <div className="space-y-4">
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <div className="text-sm font-semibold text-green-800">Preferred scenario: {comparisonResult.preferredScenarioLabel}</div>
                <div className="text-xs text-green-700 mt-1">Methodology: {comparisonResult.methodologyReference}</div>
                <div className="text-xs text-green-700 mt-1">Compared at: {new Date(comparisonResult.comparisonTimestamp).toLocaleString()}</div>
              </div>

              <div className="grid gap-4">
                {comparisonResult.scenarios.map((scenario) => (
                  <div key={scenario.scenarioLabel} className={`rounded-xl border p-4 ${scenario.preferred ? 'border-green-300 bg-green-50/70' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900">{scenario.scenarioLabel}</h3>
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Estimated</span>
                          {scenario.preferred && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-600 text-white">Preferred</span>}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{scenario.origin} &rarr; {scenario.destination}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Rank #{scenario.rank}</div>
                        <div className="text-2xl font-bold text-green-700">{scenario.estimatedCo2Kg} kg</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      <div className="rounded-lg bg-white border border-gray-200 p-3">
                        <div className="text-gray-500 text-xs uppercase mb-1">Mode</div>
                        <div className="font-medium text-gray-900">{scenario.transportMode}</div>
                      </div>
                      <div className="rounded-lg bg-white border border-gray-200 p-3">
                        <div className="text-gray-500 text-xs uppercase mb-1">Distance</div>
                        <div className="font-medium text-gray-900">{scenario.distanceKm} km</div>
                      </div>
                      <div className="rounded-lg bg-white border border-gray-200 p-3">
                        <div className="text-gray-500 text-xs uppercase mb-1">Payload</div>
                        <div className="font-medium text-gray-900">{scenario.payloadTons} t</div>
                      </div>
                      <div className="rounded-lg bg-white border border-gray-200 p-3">
                        <div className="text-gray-500 text-xs uppercase mb-1">Vehicle</div>
                        <div className="font-medium text-gray-900">{scenario.vehicleModel}</div>
                        <div className="text-xs text-gray-500 mt-1">{scenario.vehicleFuelType}</div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
                      {scenario.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={closeCompareModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Close</button>
            <button type="submit" className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2">
              <Calculator size={16} /> Compare
            </button>
          </div>
        </form>
      </Modal>

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
                    E = Distance x Payload x EF
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
