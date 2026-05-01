import { useState, useEffect } from 'react';
import { getDashboardSummary, getEmissionsOverTime, getByTransportMode, getTopPollutingRoutes } from '../api/analytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Loader2, Cloud, Navigation, Package, Activity } from 'lucide-react';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [timeData, setTimeData] = useState([]);
  const [modeData, setModeData] = useState([]);
  const [routeData, setRouteData] = useState([]);

  useEffect(() => {
    Promise.all([
      getDashboardSummary(),
      getEmissionsOverTime(),
      getByTransportMode(),
      getTopPollutingRoutes()
    ]).then(([s, t, m, r]) => {
      setSummary(s);
      setTimeData(t);
      setModeData(m);
      setRouteData(r);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  const MODE_COLORS = { 'ROAD': '#22c55e', 'RAIL': '#f97316', 'SEA': '#0ea5e9', 'AIR': '#ef4444' };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">ESG Analytics</h1>
        <p className="text-gray-500">High-level environmental impact intelligence.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <KpiCard title="Total Verified CO2" value={`${summary.totalCo2Kg.toLocaleString(undefined, {maximumFractionDigits: 2})} kg`} sub="Year to date emissions" icon={<Cloud size={20} className="text-gray-400" />} />
        <KpiCard title="Total Distance" value={`${summary.totalDistanceKm.toLocaleString(undefined, {maximumFractionDigits: 2})} km`} sub="Cumulative logistics distance" icon={<Navigation size={20} className="text-gray-400" />} />
        <KpiCard title="Total Payload" value={`${summary.totalWeightTons.toLocaleString(undefined, {maximumFractionDigits: 2})} t`} sub="Total freight weight moved" icon={<Package size={20} className="text-gray-400" />} />
        <KpiCard title="Active Operations" value={summary.activeShipmentsCount} sub="Shipments currently in transit" icon={<Activity size={20} className="text-gray-400" />} />
      </div>

      {/* Line Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-1">Actual vs Goal CO2 Emissions</h3>
        <p className="text-sm text-gray-500 mb-6">Trailing 12-month performance against corporate sustainability targets.</p>
        <div className="h-80 w-full">
          <ResponsiveContainer>
            <LineChart data={timeData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `${val/1000}k`} dx={-10} />
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="bottom" height={36} iconType="plainline" />
              <Line type="monotone" name="Actual Emissions" dataKey="actualCo2" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" name="Target Cap" dataKey="goalCo2" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">Emissions by Transport Mode</h3>
          <p className="text-sm text-gray-500 mb-6">Distribution of carbon output across logistical methods.</p>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={modeData} dataKey="totalCo2" nameKey="mode" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {modeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={MODE_COLORS[entry.mode]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(val) => `${val.toLocaleString()} kg`} />
                <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">Top Polluting Routes</h3>
          <p className="text-sm text-gray-500 mb-6">Highest aggregate emission paths year-to-date.</p>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <BarChart data={routeData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="origin" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={80} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} formatter={(val) => `${val.toLocaleString()} kg`} />
                <Bar dataKey="totalCo2" radius={[0, 4, 4, 0]}>
                  {routeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#colorGradient)`} />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, sub, icon }) {
  // Use a subtle green gradient for the first card to make it pop slightly
  const isPrimary = title.includes("CO2");
  const bgClass = isPrimary ? "bg-gradient-to-br from-white to-green-50/30 border-green-100" : "bg-white border-gray-100";
  const iconClass = isPrimary ? "text-green-500 bg-green-50" : "text-gray-500 bg-gray-50";

  return (
    <div className={`${bgClass} p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-semibold text-gray-500">{title}</h3>
        <div className={`p-2 rounded-lg ${iconClass}`}>
          {icon}
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-400 mt-2 font-medium">{sub}</div>
      </div>
    </div>
  );
}
