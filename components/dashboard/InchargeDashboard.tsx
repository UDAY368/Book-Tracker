
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, BookOpen, AlertCircle, Filter, ArrowUpDown, 
  MapPin, RefreshCw, TrendingUp, CheckCircle, Heart, Search, ChevronDown, X
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, Label
} from 'recharts';
import { api } from '../../services/api';

// --- Constants & Data ---

const YAGAM_OPTIONS = [
  "Dhyana Maha Yagam - 1", 
  "Dhyana Maha Yagam - 2", 
  "Dhyana Maha Yagam - 3", 
  "Dhyana Maha Yagam - 4"
];

const COLORS = {
  assigned: '#6366f1', // Indigo
  registered: '#3b82f6', // Blue
  submitted: '#10b981', // Emerald
  completed: '#8b5cf6', // Purple
  pendingEntry: '#f59e0b', // Amber
  pendingSubmit: '#f43f5e', // Rose
};

// --- Helper Components ---

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  colorClass, 
  bgClass, 
  subtext,
  isLoading,
  highlight = false
}: { 
  title: string, 
  value: string | number, 
  icon: any, 
  colorClass: string, 
  bgClass: string, 
  subtext?: string,
  isLoading?: boolean,
  highlight?: boolean
}) => (
  <div className={`bg-white p-5 rounded-xl border ${highlight ? 'border-indigo-200 ring-1 ring-indigo-50' : 'border-slate-200'} shadow-sm flex flex-col h-full hover:shadow-md transition-shadow`}>
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

// --- Searchable Select Component ---
const SearchableSelect = ({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder,
  disabled = false,
  className = ""
}: { 
  label: string, 
  value: string, 
  options: string[], 
  onChange: (val: string) => void, 
  placeholder: string, 
  disabled?: boolean,
  className?: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  
  // Sync internal filter with external value changes
  useEffect(() => {
      setFilter(value);
  }, [value]);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className={`relative ${className}`}>
      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{label}</label>
      <div className="relative">
          <input
              type="text"
              value={filter} 
              onClick={() => !disabled && setIsOpen(!isOpen)}
              onChange={(e) => {
                  setFilter(e.target.value);
                  if (e.target.value === '') onChange('');
                  setIsOpen(true);
              }}
              disabled={disabled}
              className="block w-full pl-3 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 transition-all font-medium text-slate-700"
              placeholder={placeholder}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
              autoComplete="off"
          />
          {!disabled && (
              <div className="absolute right-2 top-2.5 text-slate-400 pointer-events-none">
                  {isOpen ? <Search size={14} /> : <ChevronDown size={14} />}
              </div>
          )}
          {value && !disabled && (
             <button 
                onClick={(e) => { e.stopPropagation(); onChange(''); setFilter(''); }}
                className="absolute right-8 top-2.5 text-slate-300 hover:text-red-500 transition-colors"
             >
                <X size={14} />
             </button>
          )}
      </div>
      {isOpen && filteredOptions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full bg-white shadow-xl max-h-56 rounded-lg py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none custom-scrollbar border border-slate-100 animate-in fade-in zoom-in-95 duration-100">
              {filteredOptions.map((opt) => (
                  <li 
                      key={opt}
                      className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 text-slate-900 transition-colors font-medium border-b border-slate-50 last:border-0"
                      onMouseDown={(e) => {
                          e.preventDefault(); 
                          onChange(opt);
                          setFilter(opt);
                          setIsOpen(false);
                      }}
                  >
                      {opt}
                  </li>
              ))}
          </ul>
      )}
      {isOpen && filteredOptions.length === 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-lg p-3 text-xs text-slate-400 text-center border border-slate-100">
              No results found
          </div>
      )}
    </div>
  );
};

const InchargeDashboard: React.FC = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefining, setIsRefining] = useState(false);
  const [locationData, setLocationData] = useState<any>({});
  
  // Filters
  const [selectedYagam, setSelectedYagam] = useState("Dhyana Maha Yagam - 4");
  const [location, setLocation] = useState({ state: '', district: '', town: '' }); // Removed Center

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      try {
        const [booksData, locData] = await Promise.all([
             api.getReceiverBooks(), // Fetches full book list with status
             api.getLocations()
        ]);
        setBooks(booksData);
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
      if (field === 'state') { next.district = ''; next.town = ''; }
      if (field === 'district') { next.town = ''; }
      return next;
    });
    setTimeout(() => setIsRefining(false), 300);
  };

  const handleResetFilters = () => {
    setIsRefining(true);
    setLocation({ state: '', district: '', town: '' });
    setTimeout(() => setIsRefining(false), 200);
  };

  // Compute Stats based on filters
  const computedStats = useMemo(() => {
    // 1. Filter books based on location
    const filteredBooks = books.filter(b => {
        if (location.state && b.state !== location.state) return false;
        if (location.district && b.district !== location.district) return false;
        if (location.town && b.town !== location.town) return false;
        return true;
    });

    // 2. Calculate buckets
    const totalAssigned = filteredBooks.length;
    // Registered includes 'Registered', 'Received', 'Donor Updated'
    const registered = filteredBooks.filter(b => b.status === 'Registered' || b.status === 'Received').length;
    
    // Submitted (Received back)
    const submitted = filteredBooks.filter(b => b.status === 'Received').length;
    
    // Fully Completed (Data Entry Done)
    const completed = filteredBooks.filter(b => b.isDonorUpdated).length;

    // Derived
    const pendingRegistration = totalAssigned - registered;
    const pendingSubmission = registered - submitted;
    const pendingDataEntry = submitted - completed;

    return {
      totalAssigned,
      registered,
      submitted,
      completed,
      pendingRegistration,
      pendingSubmission,
      pendingDataEntry
    };
  }, [books, location]);

  // Chart Data Preparation
  const barData = [
    { name: 'Assigned', value: computedStats.totalAssigned, color: COLORS.assigned }, 
    { name: 'Registered', value: computedStats.registered, color: COLORS.registered },   
    { name: 'Submitted', value: computedStats.submitted, color: COLORS.submitted },
    { name: 'Completed', value: computedStats.completed, color: COLORS.completed },
  ];

  const pieData = [
    { name: 'Completed', value: computedStats.completed, color: COLORS.completed },
    { name: 'Pending Entry', value: computedStats.pendingDataEntry, color: COLORS.pendingEntry },
    { name: 'Pending Submit', value: computedStats.pendingSubmission, color: COLORS.pendingSubmit },
  ].filter(d => d.value > 0);

  const completionRate = computedStats.totalAssigned > 0 
    ? Math.round((computedStats.completed / computedStats.totalAssigned) * 100) 
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header & Context */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Incharge Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">Unified view for Distribution, Registration, and Collection.</p>
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
            {(location.state || location.district || location.town) && (
                <button 
                    onClick={handleResetFilters}
                    className="text-xs font-medium text-red-600 hover:text-red-800 flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors"
                >
                    <RefreshCw size={12} /> Reset
                </button>
            )}
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SearchableSelect 
                label="State" 
                value={location.state} 
                onChange={(val) => handleLocationChange('state', val)} 
                options={Object.keys(locationData)} 
                placeholder="Select State"
            />
            <SearchableSelect 
                label="District" 
                value={location.district} 
                onChange={(val) => handleLocationChange('district', val)} 
                options={location.state ? Object.keys(locationData[location.state] || {}) : []}
                placeholder="Select District"
                disabled={!location.state}
            />
            <SearchableSelect 
                label="Mandal / Town" 
                value={location.town} 
                onChange={(val) => handleLocationChange('town', val)} 
                options={location.district ? (Object.keys(locationData[location.state]?.[location.district] || {})) : []}
                placeholder="Select Town"
                disabled={!location.district}
            />
         </div>
      </div>
      
      {/* Content Area with Transition */}
      <div className={`transition-opacity duration-300 ${isRefining ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
             <StatCard 
                title="Total Assigned"
                value={computedStats.totalAssigned.toLocaleString()}
                icon={BookOpen}
                colorClass="text-indigo-600"
                bgClass="bg-indigo-50"
                subtext="Total Inventory"
                isLoading={initialLoading}
             />
             <StatCard 
                title="Registered"
                value={computedStats.registered.toLocaleString()}
                icon={Users}
                colorClass="text-blue-600"
                bgClass="bg-blue-50"
                subtext={`${computedStats.pendingRegistration} Pending`}
                isLoading={initialLoading}
             />
             <StatCard 
                title="Submitted"
                value={computedStats.submitted.toLocaleString()}
                icon={CheckCircle}
                colorClass="text-emerald-600"
                bgClass="bg-emerald-50"
                subtext={`${computedStats.pendingSubmission} Not Returned`}
                isLoading={initialLoading}
             />
             <StatCard 
                title="Fully Completed"
                value={computedStats.completed.toLocaleString()}
                icon={Heart}
                colorClass="text-purple-600"
                bgClass="bg-purple-50"
                subtext="Data Entry Done"
                isLoading={initialLoading}
                highlight={true}
             />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
             
             {/* Main Bar Chart - Lifecycle */}
             <div className="xl:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Lifecycle Overview</h3>
                        <p className="text-sm text-slate-500">Distribution Flow: Assigned → Completed</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                        <TrendingUp size={20} className="text-slate-400" />
                    </div>
                </div>
                
                <div className="h-80 w-full">
                    {initialLoading ? (
                        <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-lg">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                                <span className="text-xs text-slate-400">Loading Chart...</span>
                            </div>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barSize={60}>
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
                                 tickFormatter={(val) => `${val}`}
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

             {/* Secondary Donut Chart - Completion Status */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
                <div className="mb-2">
                    <h3 className="text-lg font-bold text-slate-800">Completion Ratio</h3>
                    <p className="text-sm text-slate-500">Books Fully Processed vs Pending</p>
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                    {initialLoading ? (
                        <div className="h-64 w-full flex items-center justify-center bg-slate-50 rounded-lg">
                            <span className="text-xs text-slate-400">Loading...</span>
                        </div>
                    ) : pieData.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                            <BookOpen size={32} className="mb-2 opacity-50"/>
                            <p className="text-sm">No Data Available</p>
                        </div>
                    ) : (
                        <div className="flex flex-row items-center h-64">
                            {/* Donut Chart */}
                            <div className="w-1/2 h-full relative">
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
                                            <Label 
                                                value={`${completionRate}%`} 
                                                position="center" 
                                                className="text-3xl font-bold text-slate-800"
                                                style={{ fontSize: '24px', fontWeight: 'bold', fill: '#1e293b' }}
                                            />
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Custom Legend */}
                            <div className="w-1/2 pl-2 space-y-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                        <span className="text-xs font-bold text-slate-600">Completed</span>
                                    </div>
                                    <p className="text-lg font-bold text-purple-600 pl-5">{computedStats.completed.toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                        <span className="text-xs font-bold text-slate-600">Pending Entry</span>
                                    </div>
                                    <p className="text-lg font-bold text-amber-600 pl-5">{computedStats.pendingDataEntry.toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                        <span className="text-xs font-bold text-slate-600">Pending Submit</span>
                                    </div>
                                    <p className="text-lg font-bold text-rose-600 pl-5">{computedStats.pendingSubmission.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
             </div>

          </div>
      </div>
    </div>
  );
};

export default InchargeDashboard;
