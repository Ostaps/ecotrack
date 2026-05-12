import { useState } from 'react';
import { compareScenarios } from '../api/scenarios';
import { Loader2, Plus, Trash2, Leaf, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './Modal';

const EMPTY_SCENARIO = {
  origin: '',
  destination: '',
  distanceKm: '',
  payloadTons: '',
  transportMode: 'ROAD',
  vehicleId: '',
  label: ''
};

export default function ScenarioComparisonModal({ isOpen, onClose, vehicles }) {
  const [scenarios, setScenarios] = useState([{ ...EMPTY_SCENARIO }, { ...EMPTY_SCENARIO }]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState(null);

  const updateScenario = (index, field, value) => {
    setScenarios(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addScenario = () => {
    if (scenarios.length >= 10) return;
    setScenarios(prev => [...prev, { ...EMPTY_SCENARIO }]);
  };

  const removeScenario = (index) => {
    if (scenarios.length <= 2) return;
    setScenarios(prev => prev.filter((_, i) => i !== index));
  };

  const handleCompare = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const payload = scenarios.map((s, i) => ({
        vehicleId: s.vehicleId,
        origin: s.origin,
        destination: s.destination,
        distanceKm: parseFloat(s.distanceKm),
        payloadTons: parseFloat(s.payloadTons),
        transportMode: s.transportMode,
        label: s.label || `Scenario ${i + 1}`
      }));
      const data = await compareScenarios(payload);
      setResults(data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Comparison failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResults(null);
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Compare Route Scenarios" wide>
      {!results ? (
        <form onSubmit={handleCompare} className="space-y-4">
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-amber-500" />
            Values shown are <span className="font-semibold text-amber-600">estimates</span> based on current methodology.
          </p>

          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            {scenarios.map((s, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 relative bg-gray-50/50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Scenario {idx + 1}</h4>
                  {scenarios.length > 2 && (
                    <button type="button" onClick={() => removeScenario(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Label (optional)</label>
                    <input type="text" placeholder={`Scenario ${idx + 1}`} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500" value={s.label} onChange={e => updateScenario(idx, 'label', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle</label>
                    <select required className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-green-500" value={s.vehicleId} onChange={e => updateScenario(idx, 'vehicleId', e.target.value)}>
                      <option value="" disabled>Select vehicle</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.model} ({v.fuelType})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Origin</label>
                    <input required type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500" value={s.origin} onChange={e => updateScenario(idx, 'origin', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Destination</label>
                    <input required type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500" value={s.destination} onChange={e => updateScenario(idx, 'destination', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Distance (km)</label>
                    <input required type="number" step="0.1" min="0.1" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500" value={s.distanceKm} onChange={e => updateScenario(idx, 'distanceKm', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Payload (tons)</label>
                    <input required type="number" step="0.1" min="0.1" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500" value={s.payloadTons} onChange={e => updateScenario(idx, 'payloadTons', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Transport Mode</label>
                    <select className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-green-500" value={s.transportMode} onChange={e => updateScenario(idx, 'transportMode', e.target.value)}>
                      <option value="ROAD">Road</option>
                      <option value="RAIL">Rail</option>
                      <option value="SEA">Sea</option>
                      <option value="AIR">Air</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {scenarios.length < 10 && (
            <button type="button" onClick={addScenario} className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1 transition-colors">
              <Plus size={16} /> Add scenario
            </button>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Leaf size={16} />}
              Compare
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold border border-amber-200 border-dashed">ESTIMATED</span>
            <span>Methodology: {results.methodologyVersion}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.scenarios.map((r, idx) => (
              <div key={idx} className={`border rounded-xl p-4 transition-all ${idx === results.preferredScenarioIndex ? 'border-green-400 bg-green-50 ring-2 ring-green-200' : 'border-gray-200 bg-white'}`}>
                {idx === results.preferredScenarioIndex && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Leaf size={14} className="text-green-600" />
                    <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Greenest Option</span>
                  </div>
                )}
                <h4 className="font-semibold text-gray-900 mb-2">{r.label}</h4>
                <div className="text-2xl font-bold text-green-700 mb-3 border-b border-dashed border-gray-200 pb-3">
                  {r.estimatedCo2Kg} <span className="text-sm font-normal text-gray-500">kg CO₂ est.</span>
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-gray-500">Vehicle</div>
                  <div className="font-medium">{r.vehicleModel}</div>
                  <div className="text-gray-500">Fuel</div>
                  <div className="font-medium">{r.vehicleFuelType}</div>
                  <div className="text-gray-500">Mode</div>
                  <div className="font-medium">{r.transportMode}</div>
                  <div className="text-gray-500">Distance</div>
                  <div className="font-medium">{r.distanceKm} km</div>
                  <div className="text-gray-500">Payload</div>
                  <div className="font-medium">{r.payloadTons} t</div>
                </div>
              </div>
            ))}
          </div>

          {results.scenarios.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <AlertTriangle size={32} className="mx-auto mb-2" />
              <p>No results returned. Check your inputs and try again.</p>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button onClick={() => setResults(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Edit Scenarios</button>
            <button onClick={handleClose} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors">Done</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
