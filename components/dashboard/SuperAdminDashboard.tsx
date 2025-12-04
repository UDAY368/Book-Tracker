
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList
} from 'recharts';
import { 
  Filter, MapPin, Users, BookOpen, Truck, 
  CheckCircle, IndianRupee, Layers, RefreshCw, ChevronRight, Clock,
  Maximize2, X, Search, ChevronLeft, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { api } from '../../services/api';

// --- Types & Interfaces ---

type DateMode = 'Relative' | 'Specific';
type RelativeDate = 'Today' | 'Last 7 Days' | 'Last 30 Days' | 'This Month' | 'Last Month';
type SpecificDateType = 'Month' | 'Quarter' | 'Year' | 'Date Range';
type SortOption = 'value_desc' | 'value_asc' | 'name_asc' | 'name_desc';

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

// --- Helper Functions ---

const formatINR = (value: number) => {
  if (value === undefined || value === null) return '₹0';
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(2)} k`;
  return `₹${value.toLocaleString()}`;
};

const formatCompactNumber = (value: number) => {
  return Intl.NumberFormat('en-US', {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

// --- Components ---

interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const FilterPill: React.FC<FilterPillProps> = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${
      active 
        ? 'bg-slate-800 text-white border-slate-800 shadow-sm' 
        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
    }`}
  >
    {label}
  </button>
);

const KPICard = ({ title, value, subtext, icon, colorClass, loading }: { title: string, value: string, subtext?: string, icon: React.ReactNode, colorClass: string, loading?: boolean }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
    <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 ${colorClass.replace('text-', 'bg-')}`}>
       {React.cloneElement(icon as React.ReactElement<any>, { size: 64 })}
    </div>
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        {loading ? (
             <div className="h-8 w-24 bg-slate-100 animate-pulse rounded mt-1"></div>
        ) : (
             <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
        )}
      </div>
      <div className={`p-2 rounded-lg ${colorClass.replace('text-', 'bg-').replace('600', '50')} ${colorClass}`}>
        {icon}
      </div>
    </div>
    {subtext && <p className="text-xs text-slate-500 font-medium relative z-10">{subtext}</p>}
  </div>
);

const SortControl = ({ value, onChange }: { value: SortOption, onChange: (val: SortOption) => void }) => (
    <div className="flex items-center">
        <select 
            value={value} 
            onChange={(e) => onChange(e.target.value as SortOption)}
            className="text-xs border-slate-200 rounded-md py-1 pl-2 pr-6 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-600 cursor-pointer"
        >
            <option value="value_desc">Value (High-Low)</option>
            <option value="value_asc">Value (Low-High)</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
        </select>
    </div>
);

const SuperAdminDashboard: React.FC = () => {
  // --- Filter States ---
  
  // 1. Time Period (Major Filter)
  const [dateMode, setDateMode] = useState<DateMode>('Relative');
  const [relativeDate, setRelativeDate] = useState<RelativeDate>('Last 30 Days');
  const [specificType, setSpecificType] = useState<SpecificDateType>('Quarter');
  
  // Specific Date Inputs
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedQuarter, setSelectedQuarter] = useState('1'); 
  const [selectedMonth, setSelectedMonth] = useState('0'); 
  const [selectedYear, setSelectedYear] = useState('2023');

  // 2. Area / Location (Dynamic Filter)
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedTown, setSelectedTown] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('');
  const [locationData, setLocationData] = useState<any>({});

  // 3. Chart Filters & Sorting
  const [activeBookMetric, setActiveBookMetric] = useState<'Distributed' | 'Registered' | 'Submitted'>('Distributed');
  
  const [donationSort, setDonationSort] = useState<SortOption>('value_desc');
  const [donorSort, setDonorSort] = useState<SortOption>('value_desc');
  const [bookSort, setBookSort] = useState<SortOption>('value_desc');

  // 4. Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'donation' | 'donors' | 'books' | null>(null);
  const [modalSearch, setModalSearch] = useState('');
  const [modalPage, setModalPage] = useState(1);
  const [modalSort, setModalSort] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const modalRowsPerPage = 10;

  // --- Data States ---
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>({
      stats: {},
      breakdownData: [], 
  });

  // Load Locations
  useEffect(() => {
    api.getLocations().then(data => setLocationData(data));
  }, []);

  // --- Helper: Determine Data Scale based on Location Depth ---
  const getLocationDepth = () => {
      if (selectedCenter) return 'Center';
      if (selectedTown) return 'Town';
      if (selectedDistrict) return 'District';
      if (selectedState) return 'State';
      return 'National';
  };

  const getAxisLabel = () => {
      if (!selectedState) return 'States';
      if (selectedState && !selectedDistrict) return 'Districts';
      if (selectedDistrict && !selectedTown) return 'Towns';
      if (selectedTown) return 'Centers';
      return 'Units';
  };

  // --- Data Fetching Logic ---
  useEffect(() => {
    const fetchStats = async () => {
        setLoading(true);
        try {
            const data = await api.getSuperAdminStats();
            setDashboardData(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    fetchStats();
  }, [
      dateMode, relativeDate, specificType, selectedQuarter, selectedMonth, selectedYear, startDate, endDate, // Time triggers
      selectedState, selectedDistrict, selectedTown, selectedCenter // Location triggers
  ]);

  // --- Sorting Logic ---
  const sortData = (data: any[], sortOption: SortOption, valueKey: string) => {
      if (!data) return [];
      const sorted = [...data];
      sorted.sort((a, b) => {
          if (sortOption === 'name_asc') return a.name.localeCompare(b.name);
          if (sortOption === 'name_desc') return b.name.localeCompare(a.name);
          if (sortOption === 'value_desc') return b[valueKey] - a[valueKey];
          if (sortOption === 'value_asc') return a[valueKey] - b[valueKey];
          return 0;
      });
      return sorted;
  };

  const donationData = useMemo(() => sortData(dashboardData.breakdownData, donationSort, 'amount'), [dashboardData.breakdownData, donationSort]);
  const donorData = useMemo(() => sortData(dashboardData.breakdownData, donorSort, 'donorCount'), [dashboardData.breakdownData, donorSort]);
  const bookData = useMemo(() => sortData(dashboardData.breakdownData, bookSort, activeBookMetric), [dashboardData.breakdownData, bookSort, activeBookMetric]);

  // --- Modal Logic ---
  const handleOpenModal = (type: 'donation' | 'donors' | 'books') => {
      setModalType(type);
      setModalSearch('');
      setModalPage(1);
      setModalSort({ key: 'name', direction: 'asc' }); // Reset sort
      setModalOpen(true);
  };

  const handleModalHeaderClick = (key: string) => {
      setModalSort(prev => ({
          key,
          direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
      }));
  };

  const getFilteredAndSortedModalData = () => {
      if (!dashboardData.breakdownData) return [];
      
      // Filter
      let filtered = dashboardData.breakdownData.filter((item: any) => 
          item.name.toLowerCase().includes(modalSearch.toLowerCase())
      );

      // Sort
      filtered.sort((a: any, b: any) => {
          const valA = a[modalSort.key];
          const valB = b[modalSort.key];
          
          if (typeof valA === 'string') {
              return modalSort.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
          } else {
              return modalSort.direction === 'asc' ? valA - valB : valB - valA;
          }
      });

      return filtered;
  };

  const filteredModalData = getFilteredAndSortedModalData();
  const totalModalPages = Math.ceil(filteredModalData.length / modalRowsPerPage);
  const currentModalData = filteredModalData.slice(
      (modalPage - 1) * modalRowsPerPage, 
      modalPage * modalRowsPerPage
  );

  // Helper for modal header sort icon
  const SortIcon = ({ columnKey }: { columnKey: string }) => {
      if (modalSort.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 text-slate-300" />;
      return modalSort.direction === 'asc' 
          ? <ArrowUp size={14} className="ml-1 text-indigo-500" />
          : <ArrowDown size={14} className="ml-1 text-indigo-500" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 relative">
      
      {/* --- MAJOR FILTER SECTION --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
           <Filter size={18} className="text-indigo-600" />
           <h3 className="font-bold text-slate-800">Dashboard Filters</h3>
        </div>
        
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          
          {/* 1. Time Period Filter (Major) */}
          <div className="lg:col-span-5 space-y-5 pr-4">
             <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-slate-500" />
                <h4 className="text-sm font-bold text-slate-700 uppercase">Time Period (Major)</h4>
             </div>

             {/* Mode Selector */}
             <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                <button 
                   onClick={() => setDateMode('Relative')} 
                   className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${dateMode === 'Relative' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                   Relative
                </button>
                <button 
                   onClick={() => setDateMode('Specific')} 
                   className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${dateMode === 'Specific' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                   Specific
                </button>
             </div>

             {/* Dynamic Inputs based on Mode */}
             <div className="min-h-[60px]">
                {dateMode === 'Relative' ? (
                    <div className="flex flex-wrap gap-2 animate-in fade-in">
                       {['Today', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month'].map(opt => (
                          <FilterPill key={opt} label={opt} active={relativeDate === opt} onClick={() => setRelativeDate(opt as RelativeDate)} />
                       ))}
                    </div>
                ) : (
                    <div className="space-y-3 animate-in fade-in">
                       <div className="flex flex-wrap gap-2">
                          {(['Month', 'Quarter', 'Year', 'Date Range'] as SpecificDateType[]).map(t => (
                            <button 
                                key={t} 
                                onClick={() => setSpecificType(t)} 
                                className={`px-3 py-1 text-xs font-medium rounded-full border ${specificType === t ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                {t}
                            </button>
                          ))}
                       </div>
                       
                       <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          {specificType === 'Month' && (
                              <div className="flex gap-4 items-center animate-in slide-in-from-top-1">
                                  <div className="flex-1">
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Year</label>
                                      <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="w-full text-sm border-slate-300 rounded-md bg-white">
                                          <option>2023</option>
                                          <option>2024</option>
                                          <option>2025</option>
                                      </select>
                                  </div>
                                  <div className="flex-1">
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Month</label>
                                      <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full text-sm border-slate-300 rounded-md bg-white">
                                          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                      </select>
                                  </div>
                              </div>
                          )}
                          {specificType === 'Quarter' && (
                              <div className="flex gap-4 items-center animate-in slide-in-from-top-1">
                                  <div className="flex-1">
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Year</label>
                                      <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="w-full text-sm border-slate-300 rounded-md bg-white">
                                          <option>2023</option>
                                          <option>2024</option>
                                          <option>2025</option>
                                      </select>
                                  </div>
                                  <div className="flex-1">
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Quarter</label>
                                      <select value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)} className="w-full text-sm border-slate-300 rounded-md bg-white">
                                          <option value="1">Q1 (Jan - Mar)</option>
                                          <option value="2">Q2 (Apr - Jun)</option>
                                          <option value="3">Q3 (Jul - Sep)</option>
                                          <option value="4">Q4 (Oct - Dec)</option>
                                      </select>
                                  </div>
                              </div>
                          )}
                          {specificType === 'Year' && (
                              <div className="animate-in slide-in-from-top-1">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Year</label>
                                  <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="w-full text-sm border-slate-300 rounded-md bg-white">
                                      <option>2023</option>
                                      <option>2024</option>
                                      <option>2025</option>
                                  </select>
                              </div>
                          )}
                          {specificType === 'Date Range' && (
                              <div className="flex gap-3 items-center animate-in slide-in-from-top-1">
                                  <div className="flex-1">
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">From</label>
                                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full text-sm border-slate-300 rounded-md bg-white" />
                                  </div>
                                  <div className="flex-1">
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To</label>
                                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full text-sm border-slate-300 rounded-md bg-white" />
                                  </div>
                              </div>
                          )}
                       </div>
                    </div>
                )}
             </div>
          </div>

          {/* 2. Area / Location Filter (Dynamic) */}
          <div className="lg:col-span-7 pl-4 space-y-5 pt-6 lg:pt-0">
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-slate-500" />
                    <h4 className="text-sm font-bold text-slate-700 uppercase">Area / Location (Dynamic)</h4>
                 </div>
                 {(selectedState || selectedDistrict || selectedTown || selectedCenter) && (
                    <button onClick={() => { setSelectedState(''); setSelectedDistrict(''); setSelectedTown(''); setSelectedCenter(''); }} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center">
                       <RefreshCw size={10} className="mr-1" /> Reset Location
                    </button>
                 )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {/* State */}
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">State</label>
                    <select 
                        value={selectedState} 
                        onChange={e => { setSelectedState(e.target.value); setSelectedDistrict(''); setSelectedTown(''); setSelectedCenter(''); }} 
                        className={`w-full text-sm p-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${selectedState ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium' : 'bg-white border-slate-300'}`}
                    >
                       <option value="">All States</option>
                       {Object.keys(locationData).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 
                 {/* District */}
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">District</label>
                    <select 
                        value={selectedDistrict} 
                        onChange={e => { setSelectedDistrict(e.target.value); setSelectedTown(''); setSelectedCenter(''); }} 
                        disabled={!selectedState} 
                        className={`w-full text-sm p-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${selectedDistrict ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium' : 'bg-white border-slate-300'} disabled:bg-slate-50 disabled:text-slate-400`}
                    >
                       <option value="">All Districts</option>
                       {selectedState && Object.keys(locationData[selectedState] || {}).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                 </div>
                 
                 {/* Town */}
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Town / Mandal</label>
                    <select 
                        value={selectedTown} 
                        onChange={e => { setSelectedTown(e.target.value); setSelectedCenter(''); }} 
                        disabled={!selectedDistrict} 
                        className={`w-full text-sm p-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${selectedTown ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium' : 'bg-white border-slate-300'} disabled:bg-slate-50 disabled:text-slate-400`}
                    >
                       <option value="">All Towns</option>
                       {selectedDistrict && Object.keys(locationData[selectedState]?.[selectedDistrict] || {}).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                 </div>
                 
                 {/* Center */}
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Center</label>
                    <select 
                        value={selectedCenter} 
                        onChange={e => setSelectedCenter(e.target.value)} 
                        disabled={!selectedTown} 
                        className={`w-full text-sm p-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${selectedCenter ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium' : 'bg-white border-slate-300'} disabled:bg-slate-50 disabled:text-slate-400`}
                    >
                       <option value="">All Centers</option>
                       {selectedTown && (locationData[selectedState]?.[selectedDistrict]?.[selectedTown] || []).map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
              </div>

              {/* Breadcrumb Visualization */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                  <span className="font-bold">Active View:</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 flex items-center"><MapPin size={10} className="mr-1 text-slate-400"/> India</span>
                  {selectedState && <><ChevronRight size={12} /><span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium text-slate-800">{selectedState}</span></>}
                  {selectedDistrict && <><ChevronRight size={12} /><span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium text-slate-800">{selectedDistrict}</span></>}
                  {selectedTown && <><ChevronRight size={12} /><span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium text-slate-800">{selectedTown}</span></>}
                  {selectedCenter && <><ChevronRight size={12} /><span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium text-slate-800">{selectedCenter}</span></>}
              </div>
          </div>

        </div>
      </div>

      {/* --- KPI SECTION (Values depend on Filters) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Total Printed Books" 
          value={dashboardData.stats.printed?.toLocaleString() || '0'} 
          icon={<Layers size={24} />} 
          colorClass="text-slate-600" 
          subtext="Total Inventory"
          loading={loading}
        />
        <KPICard 
          title="Total Distributed Books" 
          value={dashboardData.stats.distributed?.toLocaleString() || '0'} 
          icon={<Truck size={24} />} 
          colorClass="text-indigo-600" 
          subtext={`of printed`}
          loading={loading}
        />
        <KPICard 
          title="Total Registered Book" 
          value={dashboardData.stats.registered?.toLocaleString() || '0'} 
          icon={<Users size={24} />} 
          colorClass="text-blue-600" 
          subtext={`of distributed`}
          loading={loading}
        />
        <KPICard 
          title="Total Submited Book" 
          value={dashboardData.stats.submitted?.toLocaleString() || '0'} 
          icon={<CheckCircle size={24} />} 
          colorClass="text-emerald-600" 
          subtext="Books Returned"
          loading={loading}
        />
      </div>
      
      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard 
           title="Total Donor Updated Books" 
           value={dashboardData.stats.donorUpdated?.toLocaleString() || '0'} 
           icon={<BookOpen size={24} />} 
           colorClass="text-teal-600"
           subtext="Books with details"
           loading={loading}
        />
        <KPICard 
           title="Total Donars" 
           value={dashboardData.stats.donors?.toLocaleString() || '0'} 
           icon={<Users size={24} />} 
           colorClass="text-amber-600"
           loading={loading}
        />
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 rounded-xl text-white shadow-lg relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <IndianRupee size={80} />
           </div>
           <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-2">Total Donation Amount</p>
           {loading ? <div className="h-9 w-32 bg-white/20 animate-pulse rounded"></div> : <h3 className="text-3xl font-bold">{formatINR(dashboardData.stats.amount)}</h3>}
           <p className="text-sm text-indigo-100 mt-2 opacity-90 flex items-center">
              <CheckCircle size={14} className="mr-1.5" /> Verified & Collected
           </p>
        </div>
      </div>

      {/* Charts omitted for brevity, structure remains same */}
      
      {/* --- ROW 1: Donation Performance & Total Donors --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         {/* 1. Donation Performance */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-6">
               <div>
                  <h3 className="font-bold text-slate-800 text-lg">Donation Performance</h3>
                  <p className="text-sm text-slate-500">
                     Amount breakdown by <span className="font-semibold text-indigo-600">{getAxisLabel()}</span>
                  </p>
               </div>
               <div className="flex items-center gap-2">
                  <SortControl value={donationSort} onChange={setDonationSort} />
                  <button 
                      onClick={() => handleOpenModal('donation')}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Show All Data"
                  >
                      <Maximize2 size={18} />
                  </button>
               </div>
            </div>
            <div className="h-80">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={donationData.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" stroke="#64748b" width={100} tick={{fontSize: 11, fontWeight: 600}} axisLine={false} tickLine={false} />
                     <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        formatter={(val: number) => `₹${val.toLocaleString()}`}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                     />
                     <Bar dataKey="amount" name="Donation Amount" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24}>
                        <LabelList dataKey="amount" position="right" formatter={(val: number) => formatCompactNumber(val)} style={{fontSize: '11px', fill: '#64748b', fontWeight: 'bold'}} />
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* 2. Total Donors */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-6">
               <div>
                  <h3 className="font-bold text-slate-800 text-lg">Total Donors</h3>
                  <p className="text-sm text-slate-500">
                     Donor count by <span className="font-semibold text-amber-600">{getAxisLabel()}</span>
                  </p>
               </div>
               <div className="flex items-center gap-2">
                  <SortControl value={donorSort} onChange={setDonorSort} />
                  <button 
                      onClick={() => handleOpenModal('donors')}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Show All Data"
                  >
                      <Maximize2 size={18} />
                  </button>
               </div>
            </div>
            <div className="h-80">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={donorData.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" stroke="#64748b" width={100} tick={{fontSize: 11, fontWeight: 600}} axisLine={false} tickLine={false} />
                     <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                     />
                     <Bar dataKey="donorCount" name="Total Donors" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={24}>
                        <LabelList dataKey="donorCount" position="right" style={{fontSize: '11px', fill: '#64748b', fontWeight: 'bold'}} />
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
      
      {/* --- SHOW ALL DATA MODAL --- */}
      {modalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalOpen(false)}></div>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                  <div>
                     <h3 className="text-lg font-bold text-slate-800">Details</h3>
                     <p className="text-xs text-slate-500">Breakdown by {getAxisLabel()}</p>
                  </div>
                  <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-full transition-colors">
                     <X size={20} />
                  </button>
               </div>
               <div className="p-6 flex-1 overflow-hidden flex flex-col">
                  <div className="relative mb-4">
                     <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                     <input 
                        type="text" 
                        placeholder="Search location..." 
                        value={modalSearch}
                        onChange={(e) => { setModalSearch(e.target.value); setModalPage(1); }}
                        className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                     />
                  </div>
                  <div className="flex-1 overflow-auto border border-slate-200 rounded-lg">
                     <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                           <tr>
                              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleModalHeaderClick('name')}>
                                <div className="flex items-center">Location <SortIcon columnKey="name" /></div>
                              </th>
                              {modalType === 'donation' && (
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleModalHeaderClick('amount')}>
                                    <div className="flex items-center justify-end">Amount Collected <SortIcon columnKey="amount" /></div>
                                </th>
                              )}
                              {modalType === 'donors' && (
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleModalHeaderClick('donorCount')}>
                                    <div className="flex items-center justify-end">Total Donors <SortIcon columnKey="donorCount" /></div>
                                </th>
                              )}
                              {/* ... other types if needed */}
                           </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                           {currentModalData.length > 0 ? (
                              currentModalData.map((row: any, idx: number) => (
                                 <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3 text-sm font-medium text-slate-900">{row.name}</td>
                                    {modalType === 'donation' && <td className="px-6 py-3 text-sm text-right font-bold text-indigo-600">{formatINR(row.amount)}</td>}
                                    {modalType === 'donors' && <td className="px-6 py-3 text-sm text-right font-bold text-amber-600">{row.donorCount.toLocaleString()}</td>}
                                 </tr>
                              ))
                           ) : (
                              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No data found matching "{modalSearch}"</td></tr>
                           )}
                        </tbody>
                     </table>
                  </div>
                  {/* Pagination ... */}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
