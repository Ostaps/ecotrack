import { useState, useEffect } from 'react';
import { getVehicles, createVehicle, getFuelHistory } from '../api/vehicles';
import { Loader2, Search, Filter, Plus, Droplets, LineChart as LineChartIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import Drawer from '../components/Drawer';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

export default function FleetManagement() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Drawer State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [fuelHistory, setFuelHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    vin: '',
    model: '',
    fuelType: 'ELECTRIC',
    baseFuelConsumption: '',
    co2Factor: '',
    efficiencyRating: 10
  });

  const fetchData = () => {
    setLoading(true);
    getVehicles().then(res => {
      setData(res.content || res);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    try {
      await createVehicle({
        ...formData,
        baseFuelConsumption: parseFloat(formData.baseFuelConsumption),
        co2Factor: parseFloat(formData.co2Factor),
        efficiencyRating: parseInt(formData.efficiencyRating)
      });
      toast.success('Vehicle added successfully!');
      setIsAddModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to add vehicle');
    }
  };

  const handleViewDetails = async (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDrawerOpen(true);
    setHistoryLoading(true);
    try {
      const history = await getFuelHistory(vehicle.id);
      setFuelHistory(history);
    } catch (err) {
      toast.error('Failed to load fuel history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor('vin', {
      header: 'VIN / Model',
      cell: info => (
        <div>
          <div className="font-medium text-gray-900">{info.row.original.model}</div>
          <div className="text-xs text-gray-500 font-mono">{info.getValue()}</div>
        </div>
      ),
    }),
    columnHelper.accessor('fuelType', {
      header: 'Engine Type',
      cell: info => {
        const type = info.getValue();
        const colors = {
          'ELECTRIC': 'bg-green-100 text-green-700',
          'HYDROGEN': 'bg-teal-100 text-teal-700',
          'DIESEL_EURO6': 'bg-orange-100 text-orange-700',
          'DIESEL_EURO5': 'bg-red-100 text-red-700'
        };
        return (
          <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${colors[type]}`}>
            {type.replace('_', ' ')}
          </span>
        );
      }
    }),
    columnHelper.accessor('currentLoad', {
      header: 'Load',
      cell: info => <span className="text-gray-600">{info.getValue() || 0} t</span>
    }),
    columnHelper.accessor('efficiencyRating', {
      header: 'Efficiency',
      cell: info => {
        const val = info.getValue();
        const pct = (val / 10) * 100;
        let color = 'bg-green-500';
        if (val < 6) color = 'bg-red-500';
        else if (val < 8) color = 'bg-orange-500';
        
        return (
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-500 w-8">{val}/10</span>
          </div>
        );
      }
    }),
    columnHelper.accessor('lastService', {
      header: 'Last Service',
      cell: info => <span className="text-gray-500 text-sm">{info.getValue() ? new Date(info.getValue()).toLocaleDateString() : 'N/A'}</span>
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <button 
          onClick={() => handleViewDetails(info.row.original)}
          className="text-green-600 hover:text-green-700 font-medium text-sm transition-colors"
        >
          View Details
        </button>
      )
    })
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Fleet Management</h1>
          <p className="text-gray-500">Monitor and manage your active logistics fleet.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#22c55e] hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Add Vehicle
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by VIN or Model..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select className="pl-10 pr-8 py-2 rounded-lg border border-gray-200 focus:outline-none appearance-none bg-white">
              <option>All Types</option>
              <option>Electric</option>
              <option>Diesel</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-green-500" /></div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 z-10">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100">
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-white hover:shadow-md hover:scale-[1.002] transition-all duration-200 bg-white group">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap bg-transparent">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Vehicle Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Vehicle">
        <form onSubmit={handleCreateVehicle} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">VIN (Vehicle Identification Number)</label>
            <input required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.vin} onChange={e => setFormData({...formData, vin: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model / Make</label>
            <input required type="text" placeholder="e.g. Tesla Semi" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Engine Fuel Type</label>
            <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 bg-white" value={formData.fuelType} onChange={e => setFormData({...formData, fuelType: e.target.value})}>
              <option value="ELECTRIC">Electric (EV)</option>
              <option value="HYDROGEN">Hydrogen Fuel Cell</option>
              <option value="DIESEL_EURO6">Diesel (Euro 6)</option>
              <option value="DIESEL_EURO5">Diesel (Euro 5 or below)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Consumption (L/100km or kWh)</label>
              <input required type="number" step="0.1" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.baseFuelConsumption} onChange={e => setFormData({...formData, baseFuelConsumption: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CO2 Factor (kg/L or kg/kWh)</label>
              <input required type="number" step="0.01" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.co2Factor} onChange={e => setFormData({...formData, co2Factor: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Efficiency Rating (1-10)</label>
            <input required type="number" min="1" max="10" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500" value={formData.efficiencyRating} onChange={e => setFormData({...formData, efficiencyRating: e.target.value})} />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors">Save Vehicle</button>
          </div>
        </form>
      </Modal>

      {/* Fuel History Drawer */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Vehicle Telemetry">
        {selectedVehicle && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-2">{selectedVehicle.model}</h3>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div className="text-gray-500">VIN</div>
                <div className="font-mono text-gray-900">{selectedVehicle.vin}</div>
                <div className="text-gray-500">Fuel Type</div>
                <div className="font-bold text-green-700">{selectedVehicle.fuelType}</div>
                <div className="text-gray-500">Base Consumption</div>
                <div className="font-medium">{selectedVehicle.baseFuelConsumption}</div>
                <div className="text-gray-500">CO2 Factor</div>
                <div className="font-medium">{selectedVehicle.co2Factor}</div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <LineChartIcon className="text-gray-400" size={20} />
                <h4 className="font-bold text-gray-900">Emissions History</h4>
              </div>
              {historyLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-green-500" /></div>
              ) : fuelHistory.length === 0 ? (
                <div className="text-center p-8 text-gray-400 text-sm border border-dashed border-gray-300 rounded-xl">No emission logs found for this vehicle.</div>
              ) : (
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={fuelHistory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="calculatedAt" hide />
                      <YAxis tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 11}} width={30} />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="co2Amount" stroke="#22c55e" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
