
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { 
  Truck, ClipboardList, Printer, CheckCircle, AlertCircle, Filter, ArrowUpDown, Heart, Building2, ChevronDown
} from 'lucide-react';
import { api } from '../../services/api';
import { DistributorStats } from '../../types';

const YAGAM_OPTIONS = [
  "Dhyana Maha Yagam - 1", 
  "Dhyana Maha Yagam - 2", 
  "Dhyana Maha Yagam - 3", 
  "Dhyana Maha Yagam - 4"
];

// Reusable Searchable Select Component
const SearchableSelect = ({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled = false
}: { label: string, value: string, options: string[], onChange: (val: string) => void, placeholder: string, disabled?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
      setFilter(value);
  }, [value]);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="relative">
      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{label}</label>
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
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm disabled:bg-slate-50 disabled:text-slate-400 transition-all font-medium text-slate-700"
              placeholder={placeholder}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          />
          {!disabled && (
              <ChevronDown className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
          )}
      </div>
      {isOpen && filteredOptions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full bg-white shadow-xl max-h-60 rounded-lg py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none custom-scrollbar border border-slate-100 animate-in fade-in zoom-in-95 duration-100">
              {filteredOptions.map((opt) => (
                  <li
                      key={opt}
                      className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 text-slate-900 transition-colors"
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
    </div>
  );
};

// Enhanced Card Component to show Total vs Gap
const LifecycleCard: React.FC<{ 
  title: string; 
  mainValue: number; 
  icon: React.ReactNode; 
  baseColor: string; // tailwind class prefix e.g., "emerald"
  gapLabel: string;
  gapValue: number;
  gapColor: string; // tailwind class prefix e.g. "amber"
  isFinal?: boolean;
}> = ({ title, mainValue, icon, baseColor, gapLabel, gapValue, gapColor, isFinal }) => {
  
  // Dynamic color classes
  const bgSoft = `bg-${baseColor}-50`;
  const textDark = `text-${baseColor}-700`;
  
  const gapBg = `bg-${gapColor}-50`;
  const gapText = `text-${gapColor}-700`;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow`}>
      {/* Top Section: Main Stat */}
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2.5 rounded-lg ${bgSoft} ${textDark}`}>
            {icon}
          </div>
          {isFinal && (
             <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-bold px-2 py-1 rounded-full">
               Goal
             </span>
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-1">{mainValue.toLocaleString()}</h3>
        </div>
      </div>

      {/* Bottom Section: Gap Analysis */}
      <div className={`px-5 py-3 border-t border-slate-100 ${gapBg}`}>
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
              {!isFinal ? (
                <AlertCircle size={14} className={gapText} />
              ) : (
                <CheckCircle size={14} className={gapText} />
              )}
              <span className={`text-xs font-semibold uppercase ${gapText}`}>{gapLabel}</span>
           </div>
           <span className={`text-sm font-bold ${gapText}`}>{gapValue.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

const DistributorDashboard: React.FC = () => {
  const [stats, setStats] = useState<DistributorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationData, setLocationData] = useState<any>({});
  const [distributions, setDistributions] = useState<any[]>([]);
  
  // Filters
  const [selectedYagam, setSelectedYagam] = useState("Dhyana Maha Yagam - 4");
  const [location, setLocation] = useState({ state: '', district: '', town: '' });

  useEffect(() => {
    const loadData = async () => {
      // Fetch all necessary data: Stats, Locations, and raw Distribution list
      const [statsData, locData, distData] = await Promise.all([
          api.getDistributorStats(),
          api.getLocations(),
          api.getDistributions()
      ]);
      setStats(statsData);
      setLocationData(locData);
      setDistributions(distData);
      setLoading(false);
    };
    loadData();
  }, [selectedYagam]); // Re-load if Yagam changes (mock behavior)

  // Compute scaled stats based on filters to simulate data granularity
  const displayStats = useMemo(() => {
    if (!stats) return null;
    
    // In a real app, API would handle filtering. Here we return the raw stats.
    return {
      totalPrinted: stats.totalPrinted,
      totalDistributed: stats.totalDistributed,
      totalRegistered: stats.totalRegistered,
      totalReceived: stats.totalReceived,
      printedNotDistributed: stats.printedNotDistributed,
      distributedNotRegistered: stats.distributedNotRegistered,
      registeredNotReceived: stats.registeredNotReceived,
      donorUpdated: stats.donorUpdated
    };
  }, [stats, location]);

  if (loading || !displayStats) {
    return <div className="p-8 text-center text-slate-400">Loading Dashboard...</div>;
  }

  // Calculate Gaps
  const unassignedBooks = displayStats.printedNotDistributed; // Total Printed - Distributed
  const unregisteredBooks = displayStats.distributedNotRegistered; // Distributed - Registered
  const notSubmittedBooks = displayStats.registeredNotReceived; // Registered - Submitted
  const notUpdatedBooks = displayStats.totalReceived - displayStats.donorUpdated; // Submitted - Donor Updated
  
  // Data for the waterfall/flow chart
  const flowData = [
    { name: 'Printed', value: displayStats.totalPrinted, color: '#64748b' },
    { name: 'Distributed', value: displayStats.totalDistributed, color: '#6366f1' },
    { name: 'Registered', value: displayStats.totalRegistered, color: '#3b82f6' },
    { name: 'Submitted', value: displayStats.totalReceived, color: '#10b981' },
    { name: 'Donor Updated', value: displayStats.donorUpdated, color: '#8b5cf6' },
  ];

  // Data for Distribution by Type - Calculated from real `distributions` data
  // Modified to always include categories even if 0, to maintain chart layout
  const typeData = (() => {
      const counts: Record<string, number> = { 'Individual': 0, 'Center': 0, 'District': 0, 'Autonomous': 0 };
      
      distributions.forEach(d => {
          // Optional: Filter by location if selected
          let match = true;
          const addr = d.address || ''; // Safe fallback
          if (location.state && !addr.includes(location.state)) match = false;
          if (location.district && !addr.includes(location.district)) match = false;
          
          if (match && counts[d.type] !== undefined) {
              counts[d.type] += (d.count || 0);
          }
      });

      // Always return 4 categories for consistent chart layout
      return [
          { name: 'Individual', value: counts['Individual'], color: '#3b82f6' },
          { name: 'District', value: counts['District'], color: '#f59e0b' },
          { name: 'Center', value: counts['Center'], color: '#10b981' },
          { name: 'Autonomous', value: counts['Autonomous'], color: '#6366f1' },
      ];
  })();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header with Yagam Selection */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Distributor Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">Track inventory, shipments, and distribution gaps.</p>
        </div>
        
        <div className="w-full md:w-auto bg-indigo-50 p-2 rounded-lg border border-indigo-100">
            <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-1 ml-1">Event Context</label>
            <div className="relative">
                <select 
                    value={selectedYagam}
                    onChange={(e) => setSelectedYagam(e.target.value)}
                    className="w-full md:w-64 appearance-none bg-white border border-indigo-200 text-indigo-700 font-bold py-2 pl-4 pr-10 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-sm"
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
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
         <div className="flex items-center gap-2 text-slate-700 font-bold border-b border-slate-100 pb-3">
            <Filter size={18} className="text-indigo-600" />
            <span>Dashboard Scope</span>
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <SearchableSelect 
                label="State" 
                value={location.state} 
                onChange={(val) => setLocation({ state: val, district: '', town: '' })} 
                options={Object.keys(locationData)}
                placeholder="Select State"
            />
            <SearchableSelect 
                label="District" 
                value={location.district} 
                onChange={(val) => setLocation(prev => ({ ...prev, district: val, town: '' }))} 
                options={location.state ? Object.keys(locationData[location.state] || {}) : []}
                placeholder="Select District"
                disabled={!location.state}
            />
            <SearchableSelect 
                label="Mandal / Town" 
                value={location.town} 
                onChange={(val) => setLocation(prev => ({ ...prev, town: val }))} 
                options={location.district ? (Object.keys(locationData[location.state]?.[location.district] || {})) : []}
                placeholder="Select Town"
                disabled={!location.district}
            />
         </div>
         {location.state && (
            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button 
                onClick={() => setLocation({ state: '', district: '', town: '' })}
                className="px-4 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-md font-medium transition-colors"
              >
                Reset Filters
              </button>
            </div>
         )}
      </div>

      {/* 1. Lifecycle Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        
        {/* Card 1: Printed */}
        <LifecycleCard 
          title="Total Printed"
          mainValue={displayStats.totalPrinted}
          icon={<Printer size={24} />}
          baseColor="slate"
          gapLabel="Unassigned"
          gapValue={unassignedBooks}
          gapColor="slate"
        />

        {/* Card 2: Distributed */}
        <LifecycleCard 
          title="Total Distributed"
          mainValue={displayStats.totalDistributed}
          icon={<Truck size={24} />}
          baseColor="indigo"
          gapLabel="Unregistered"
          gapValue={unregisteredBooks}
          gapColor="amber"
        />

        {/* Card 3: Registered */}
        <LifecycleCard 
          title="Total Registered"
          mainValue={displayStats.totalRegistered}
          icon={<ClipboardList size={24} />}
          baseColor="blue"
          gapLabel="Not Submitted"
          gapValue={notSubmittedBooks}
          gapColor="red"
        />

        {/* Card 4: Submitted */}
        <LifecycleCard 
          title="Total Submitted"
          mainValue={displayStats.totalReceived}
          icon={<CheckCircle size={24} />}
          baseColor="emerald"
          gapLabel="Not Updated"
          gapValue={notUpdatedBooks}
          gapColor="orange"
        />

        {/* Card 5: Donor Updated */}
        <LifecycleCard 
          title="Donor Updated"
          mainValue={displayStats.donorUpdated}
          icon={<Heart size={24} />}
          baseColor="purple"
          gapLabel="Total Completion"
          gapValue={`${Math.round((displayStats.donorUpdated/displayStats.totalPrinted)*100) || 0}%` as any}
          gapColor="purple"
          isFinal={true}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Flow Chart - 2/3 Width */}
        <div className="xl:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
             <div>
               <h3 className="text-lg font-bold text-slate-800">Distribution Funnel Analysis</h3>
               <p className="text-sm text-slate-500">Visualizing the drop-off from Printed to Donor Updated.</p>
             </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={50}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fontWeight: 600}}
                  dy={10}
                />
                <YAxis 
                  stroke="#64748b" 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip 
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} 
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1000}>
                  {flowData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution by Type Chart - 1/3 Width */}
        <div className="xl:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="mb-6">
               <h3 className="text-lg font-bold text-slate-800">Distributed by Type</h3>
               <p className="text-sm text-slate-500">Total books allocated by entity type.</p>
           </div>
           
           <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={typeData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="#64748b" 
                      width={80} 
                      tick={{fontSize: 12, fontWeight: 600}} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <Tooltip 
                       cursor={{fill: '#f8fafc'}}
                       contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                       {typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DistributorDashboard;
