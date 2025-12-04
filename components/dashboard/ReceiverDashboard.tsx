
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, CheckCircle, Clock, 
  User, Filter, ArrowUpDown, RefreshCw, Heart, MapPin, AlertCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { api } from '../../services/api';
import { ReceiverBook } from '../../types';

// --- Constants & Data ---

const YAGAM_OPTIONS = [
  "Dhyana Maha Yagam - 1", 
  "Dhyana Maha Yagam - 2", 
  "Dhyana Maha Yagam - 3", 
  "Dhyana Maha Yagam - 4"
];

// --- Helper Components ---

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  colorClass, 
  bgClass,
  isPending = false
}: { 
  title: string, 
  value: string | number, 
  icon: any, 
  colorClass: string, 
  bgClass: string,
  isPending?: boolean
}) => (
  <div className={`bg-white p-5 rounded-xl border ${isPending ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-100'} shadow-sm flex items-center justify-between transition-all hover:shadow-md`}>
    <div>
      <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      {isPending && <p className="text-[10px] text-amber-600 font-bold mt-1">Action Required</p>}
    </div>
    <div className={`p-3 rounded-lg ${bgClass} ${colorClass}`}>
      <Icon size={24} />
    </div>
  </div>
);

const FilterSelect = ({ 
  label, 
  value, 
  onChange, 
  options, 
  disabled = false 
}: { 
  label: string, 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, 
  options: string[], 
  disabled?: boolean 
}) => (
  <div className="flex-1 min-w-[140px]">
    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{label}</label>
    <div className="relative">
      <select 
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="block w-full pl-3 pr-8 py-2 text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 transition-colors cursor-pointer appearance-none border shadow-sm"
      >
        <option value="">All {label}s</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
        <ArrowUpDown size={12} />
      </div>
    </div>
  </div>
);

const ReceiverDashboard: React.FC = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationData, setLocationData] = useState<any>({});
  
  // Filters
  const [selectedYagam, setSelectedYagam] = useState("Dhyana Maha Yagam - 4");
  const [location, setLocation] = useState({ state: '', district: '', town: '', center: '' });
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    loadBooks();
  }, [selectedYagam]);

  const loadBooks = async () => {
    setLoading(true);
    const [data, locData] = await Promise.all([
        api.getReceiverBooks(),
        api.getLocations()
    ]);
    
    const enrichedData = data.map((b, i) => {
        return {
            ...b,
            state: b.state || '',
            district: b.district || '',
            town: b.town || '',
            center: b.center || '',
            // Ensure we use the isDonorUpdated flag from API which implements the strict logic
        };
    });

    setBooks(enrichedData);
    setLocationData(locData);
    setLoading(false);
  };

  // Handle Location Change
  const handleLocationChange = (field: keyof typeof location, value: string) => {
    setIsRefining(true);
    setLocation(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'state') { next.district = ''; next.town = ''; next.center = ''; }
      if (field === 'district') { next.town = ''; next.center = ''; }
      if (field === 'town') { next.center = ''; }
      return next;
    });
    setTimeout(() => setIsRefining(false), 200);
  };

  const handleResetFilters = () => {
    setIsRefining(true);
    setLocation({ state: '', district: '', town: '', center: '' });
    setTimeout(() => setIsRefining(false), 200);
  };

  const getCentersForTown = (town: string) => {
    return (location.state && location.district && town) 
        ? (locationData[location.state]?.[location.district]?.[town] || []) 
        : [];
  };

  // Filtered Data Computation
  const filteredBooks = useMemo(() => {
      return books.filter(b => {
          if (location.state && b.state !== location.state) return false;
          if (location.district && b.district !== location.district) return false;
          if (location.town && b.town !== location.town) return false;
          if (location.center && b.center !== location.center) return false;
          return true;
      });
  }, [books, location]);

  // --- Stats Calculation ---
  // Status Flow: Distributed -> Registered -> Received (Submitted) -> (Logic Check) -> Donor Updated
  const totalDistributed = filteredBooks.length;
  const totalRegistered = filteredBooks.filter(b => b.status === 'Registered').length;
  
  // Submitted includes Donor Updated because Donor Updated books are also 'Received' status
  const totalSubmitted = filteredBooks.filter(b => b.status === 'Received').length;
  
  // Donor Updated is strict subset of Submitted where entered >= declared
  const totalDonorUpdated = filteredBooks.filter(b => b.isDonorUpdated).length; 
  
  // Pending Data Entry = Submitted Books that are NOT yet fully Donor Updated
  const pendingDataEntry = totalSubmitted - totalDonorUpdated;
  
  const pendingRegistration = filteredBooks.filter(b => b.status === 'Distributed').length;

  const chartData = [
    { name: 'Distributed', value: totalDistributed, color: '#6366f1' },
    { name: 'Registered', value: totalRegistered, color: '#3b82f6' },
    { name: 'Submitted', value: totalSubmitted, color: '#10b981' },
    { name: 'Pending Entry', value: pendingDataEntry, color: '#f59e0b' },
    { name: 'Completed', value: totalDonorUpdated, color: '#8b5cf6' },
  ];

  if (loading) return <div className="p-8 text-center text-slate-400">Loading Dashboard...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. Header & Context */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Receiver Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">Monitor book collection and donor information updates.</p>
        </div>
        
        <div className="w-full md:w-auto bg-indigo-50 p-2 rounded-lg border border-indigo-100">
            <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-1 ml-1">Event Context</label>
            <div className="relative">
                <select 
                    value={selectedYagam}
                    onChange={(e) => setSelectedYagam(e.target.value)}
                    className="w-full md:w-64 appearance-none bg-white border border-indigo-200 text-indigo-700 font-bold py-2 pl-4 pr-10 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-sm shadow-sm"
                >
                    {YAGAM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-indigo-600">
                    <ArrowUpDown size={14} />
                </div>
            </div>
        </div>
      </div>

      {/* 2. Dashboard Scope Filters */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
         <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Filter size={18} className="text-indigo-600" />
                <span>Dashboard Scope</span>
            </div>
            {(location.state || location.district || location.town || location.center) && (
                <button 
                    onClick={handleResetFilters}
                    className="text-xs font-medium text-red-600 hover:text-red-800 flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors"
                >
                    <RefreshCw size={12} /> Reset
                </button>
            )}
         </div>
         
         <div className="flex flex-col md:flex-row gap-4">
            <FilterSelect 
                label="State" 
                value={location.state} 
                onChange={(e) => handleLocationChange('state', e.target.value)} 
                options={Object.keys(locationData)} 
            />
            <FilterSelect 
                label="District" 
                value={location.district} 
                onChange={(e) => handleLocationChange('district', e.target.value)} 
                options={location.state ? Object.keys(locationData[location.state] || {}) : []}
                disabled={!location.state}
            />
            <FilterSelect 
                label="Mandal / Town" 
                value={location.town} 
                onChange={(e) => handleLocationChange('town', e.target.value)} 
                options={location.district ? (Object.keys(locationData[location.state]?.[location.district] || {})) : []}
                disabled={!location.district}
            />
            <FilterSelect 
                label="Center" 
                value={location.center} 
                onChange={(e) => handleLocationChange('center', e.target.value)} 
                options={getCentersForTown(location.town)}
                disabled={!location.town}
            />
         </div>
      </div>

      {/* 3. KPI Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 transition-opacity duration-300 ${isRefining ? 'opacity-60' : 'opacity-100'}`}>
         {/* Total Assigned / Distributed */}
         <StatCard 
            title="Total Assigned" 
            value={totalDistributed} 
            icon={BookOpen} 
            bgClass="bg-indigo-50" 
            colorClass="text-indigo-600" 
         />
         {/* Pending Submission (Registered but not Submitted) */}
         <StatCard 
            title="Pending Submit" 
            value={totalRegistered} 
            icon={Clock} 
            bgClass="bg-blue-50" 
            colorClass="text-blue-600" 
         />
         {/* Submitted (Received) */}
         <StatCard 
            title="Submitted Books" 
            value={totalSubmitted} 
            icon={CheckCircle} 
            bgClass="bg-emerald-50" 
            colorClass="text-emerald-600" 
         />
         {/* Pending Data Entry (Critical Gap) */}
         <StatCard 
            title="Pending Donor Update" 
            value={pendingDataEntry} 
            icon={AlertCircle} 
            bgClass="bg-amber-50" 
            colorClass="text-amber-600"
            isPending={false} // Removed highlight as requested
         />
         {/* Completed (Donor Updated) */}
         <StatCard 
            title="Fully Completed" 
            value={totalDonorUpdated} 
            icon={Heart} 
            bgClass="bg-purple-50" 
            colorClass="text-purple-600" 
         />
      </div>

      {/* 4. Bar Chart */}
      <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-opacity duration-300 ${isRefining ? 'opacity-60' : 'opacity-100'}`}>
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-slate-800">Book Status Overview</h3>
             <div className="text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded border border-slate-100 flex items-center">
                <MapPin size={14} className="mr-1.5" />
                {location.center || location.town || location.district || location.state || 'All Locations'}
             </div>
          </div>
          <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={50}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10} 
                    fontSize={12} 
                    fontWeight={600} 
                  />
                  <YAxis stroke="#64748b" axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={1000}>
                      {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                  </Bar>
              </BarChart>
              </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};

export default ReceiverDashboard;
