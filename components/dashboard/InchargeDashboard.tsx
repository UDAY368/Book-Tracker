
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, BookOpen, AlertCircle, Filter, ArrowUpDown, 
  MapPin, RefreshCw, PieChart as PieChartIcon, 
  TrendingUp, CheckCircle, Clock
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { api } from '../../services/api';
import { InchargeStats } from '../../types';

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
  subtext,
  isLoading 
}: { 
  title: string, 
  value: string | number, 
  icon: any, 
  colorClass: string, 
  bgClass: string, 
  subtext?: string,
  isLoading?: boolean
}) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        {isLoading ? (
          <div className="h-8 w-24 bg-slate-100 animate-pulse rounded mt-2"></div>
        ) : (
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
        )}
      </div>
      <div className={`p-3 rounded-lg ${bgClass} ${colorClass}`}>
        <Icon size={20} />
      </div>
    </div>
    {isLoading ? (
       <div className="h-4 w-32 bg-slate-50 animate-pulse rounded"></div>
    ) : subtext && (
      <p className="text-xs text-slate-500 font-medium mt-auto pt-2 border-t border-slate-50 flex items-center">
        {subtext}
      </p>
    )}
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

const InchargeDashboard: React.FC = () => {
  const [stats, setStats] = useState<InchargeStats | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefining, setIsRefining] = useState(false);
  const [locationData, setLocationData] = useState<any>({});
  
  // Filters
  const [selectedYagam, setSelectedYagam] = useState("Dhyana Maha Yagam - 4");
  const [location, setLocation] = useState({ state: '', district: '', town: '', center: '' });

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      try {
        const [s, locData] = await Promise.all([
             api.getInchargeStats(),
             api.getLocations()
        ]);
        setStats(s);
        setLocationData(locData);
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };
    loadData();
  }, [selectedYagam]);

  // Handle Location Change (Instant UI Update)
  const handleLocationChange = (field: keyof typeof location, value: string) => {
    setIsRefining(true);
    setLocation(prev => {
      const next = { ...prev, [field]: value };
      // Cascade Reset
      if (field === 'state') { next.district = ''; next.town = ''; next.center = ''; }
      if (field === 'district') { next.town = ''; next.center = ''; }
      if (field === 'town') { next.center = ''; }
      return next;
    });
    // Short timeout to smooth the visual transition slightly
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

  // Compute Scaled Stats based on filters locally
  // This avoids a full page reload and makes the dashboard feel snappy
  const displayStats = useMemo(() => {
    if (!stats) return null;
    
    // Determine scaling factor based on filter depth
    let factor = 1.0;
    
    // No random scaling, strict data
    return {
      totalAssigned: stats.totalAssigned,
      distributed: stats.distributed,
      pendingDetails: stats.pendingDetails,
      amountCollected: stats.amountCollected
    };
  }, [stats, location]);

  // Chart Data Preparation
  const barData = displayStats ? [
    { name: 'Distributed', value: displayStats.totalAssigned, color: '#6366f1' }, 
    { name: 'Registered', value: displayStats.distributed, color: '#10b981' },   
    { name: 'Pending', value: displayStats.pendingDetails, color: '#f59e0b' },
  ] : [];

  const pieData = displayStats ? [
    { name: 'Registered', value: displayStats.distributed, color: '#10b981' },
    { name: 'Pending', value: displayStats.pendingDetails, color: '#f59e0b' },
  ] : [];

  const completionRate = displayStats && displayStats.totalAssigned > 0 
    ? Math.round((displayStats.distributed / displayStats.totalAssigned) * 100) 
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header & Context */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Staff Workspace</h2>
          <p className="text-slate-500 text-sm mt-1">Manage book distribution, registration, and collection.</p>
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

      {/* Dashboard Scope Filters */}
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
      
      {/* Content Area with Transition */}
      <div className={`transition-opacity duration-300 ${isRefining ? 'opacity-60' : 'opacity-100'}`}>
          
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
             <StatCard 
                title="Assigned Books"
                value={displayStats?.totalAssigned.toLocaleString() || 0}
                icon={BookOpen}
                colorClass="text-indigo-600"
                bgClass="bg-indigo-50"
                subtext="Total Inventory"
                isLoading={initialLoading}
             />
             <StatCard 
                title="Registered"
                value={displayStats?.distributed.toLocaleString() || 0}
                icon={CheckCircle}
                colorClass="text-emerald-600"
                bgClass="bg-emerald-50"
                subtext={`${completionRate}% Completed`}
                isLoading={initialLoading}
             />
             <StatCard 
                title="Pending Action"
                value={displayStats?.pendingDetails.toLocaleString() || 0}
                icon={Clock}
                colorClass="text-amber-600"
                bgClass="bg-amber-50"
                subtext="Needs Registration"
                isLoading={initialLoading}
             />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             
             {/* Main Bar Chart */}
             <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Book Status Overview</h3>
                        <p className="text-sm text-slate-500">Distribution vs Registration Progress</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                        <TrendingUp size={20} className="text-slate-400" />
                    </div>
                </div>
                
                <div className="h-72 w-full">
                    {initialLoading ? (
                        <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-lg">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                                <span className="text-xs text-slate-400">Loading Chart...</span>
                            </div>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barSize={50}>
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
                              <YAxis 
                                 stroke="#64748b" 
                                 axisLine={false} 
                                 tickLine={false} 
                                 fontSize={12}
                                 tickFormatter={(val) => `${val/1000}k`}
                              />
                              <Tooltip 
                                 cursor={{fill: '#f8fafc'}}
                                 contentStyle={{
                                    backgroundColor: '#fff', 
                                    borderRadius: '12px', 
                                    border: 'none', 
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    padding: '12px 16px'
                                 }}
                                 itemStyle={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}
                                 formatter={(value: number) => [value.toLocaleString(), 'Books']}
                              />
                              <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={800}>
                                 {barData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                 ))}
                              </Bar>
                           </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
             </div>

             {/* Secondary Pie Chart */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Completion Ratio</h3>
                    <p className="text-sm text-slate-500">Registered vs Pending</p>
                </div>
                
                <div className="h-64 w-full flex-1 relative">
                    {initialLoading ? (
                        <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-lg">
                            <span className="text-xs text-slate-400">Loading...</span>
                        </div>
                    ) : (
                        <>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-slate-800">{completionRate}%</p>
                                    <p className="text--[10px] uppercase font-bold text-slate-400">Complete</p>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                                </PieChart>
                            </ResponsiveContainer>
                        </>
                    )}
                </div>
             </div>

          </div>
      </div>
    </div>
  );
};

export default InchargeDashboard;
