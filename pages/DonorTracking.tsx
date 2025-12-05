
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight, User, MapPin, 
  ArrowUpDown, Briefcase, IndianRupee, RefreshCw, Loader2,
  Eye, X, Phone, Mail, CreditCard, Hash, Map, FileText, ChevronDown, CheckCircle
} from 'lucide-react';
import { api } from '../services/api';

const YAGAM_OPTIONS = [
  "Dhyana Maha Yagam - 1", 
  "Dhyana Maha Yagam - 2", 
  "Dhyana Maha Yagam - 3", 
  "Dhyana Maha Yagam - 4"
];

const PROFESSIONS = [
    'Agriculture', 'Business', 'Software', 'State Govt', 
    'Central Govt', 'Doctor', 'Student', 'House Wife', 'Others'
];

interface Donor {
  id: string;
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  profession: string;
  idProofType?: string;
  idProofNumber?: string;
  address: string;
  state: string;
  district: string;
  town: string;
  pincode?: string;
  bookNumber: string;
  amount: number;
  paymentMode?: string;
  transactionId?: string;
  checkNumber?: string;
  receiptNumber?: string;
  yagam: string;
}

// --- Reusable Components ---

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
  
  useEffect(() => {
      setFilter(value || '');
  }, [value]);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className={`relative ${className}`}>
      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">{label}</label>
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
              className="block w-full pl-3 pr-8 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm disabled:bg-slate-50 disabled:text-slate-400 transition-all font-medium text-slate-700"
              placeholder={placeholder}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
              autoComplete="off"
          />
          
          {/* X Button to Clear */}
          {!disabled && value && (
             <button 
                type="button"
                onClick={(e) => { 
                    e.stopPropagation(); 
                    onChange(''); 
                    setFilter(''); 
                }}
                className="absolute right-8 top-2.5 text-slate-400 hover:text-red-500 transition-colors z-10 p-0.5 rounded-full hover:bg-slate-100"
                title="Clear"
             >
                <X size={14} />
             </button>
          )}

          {!disabled && (
              <div className="absolute right-3 top-2.5 text-slate-400 pointer-events-none">
                  <ChevronDown size={16} />
              </div>
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
              No matches found
          </div>
      )}
    </div>
  );
};

const KPIBox = ({ title, count, amount, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
            <div className={`p-2 rounded-lg ${bgClass} ${colorClass}`}>
                <Icon size={20} />
            </div>
            <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{title}</p>
                <h3 className="text-xl font-bold text-slate-800">{count.toLocaleString()}</h3>
            </div>
        </div>
        <div className="pt-2 border-t border-slate-50 mt-1">
            <p className={`text-sm font-bold ${colorClass} text-right`}>₹{amount.toLocaleString()}</p>
        </div>
    </div>
);

const ProfessionCard = ({ profession, count, amount }: { profession: string, count: number, amount: number }) => (
    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors flex flex-col items-center text-center">
        <div className="w-full flex justify-between items-center mb-1.5 pb-1.5 border-b border-slate-50">
            <span className="text-xs font-bold text-slate-600 truncate max-w-[80%]">{profession}</span>
            <span className="text-[10px] font-medium bg-slate-100 px-1.5 rounded text-slate-500">{count}</span>
        </div>
        <span className="text-sm font-bold text-emerald-600">₹{amount.toLocaleString()}</span>
    </div>
);

const DonorTracking: React.FC = () => {
  const [selectedYagam, setSelectedYagam] = useState("Dhyana Maha Yagam - 4");
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState({ state: '', district: '', town: '' });
  
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
  const [isLoading, setIsLoading] = useState(true);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [locations, setLocations] = useState<any>({});
  
  // Modal State
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedYagam]);

  const loadData = async () => {
      setIsLoading(true);
      try {
          const [allDonors, locData] = await Promise.all([
              api.getAllDonors(),
              api.getLocations()
          ]);
          setDonors(allDonors);
          setLocations(locData);
      } catch (e) {
          console.error("Failed to load data", e);
      } finally {
          setIsLoading(false);
      }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setLocationFilter({ state: '', district: '', town: '' });
    setCurrentPage(1);
  };

  // --- Filtering Logic ---
  const filteredDonors = useMemo(() => {
    return donors.filter(donor => {
        // Text Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchesText = 
                donor.name.toLowerCase().includes(q) || 
                donor.phone.includes(q) ||
                donor.bookNumber.toLowerCase().includes(q) ||
                (donor.email && donor.email.toLowerCase().includes(q));
            if (!matchesText) return false;
        }
        
        // Location Filters
        if (locationFilter.state && donor.state !== locationFilter.state) return false;
        if (locationFilter.district && donor.district !== locationFilter.district) return false;
        if (locationFilter.town && donor.town !== locationFilter.town) return false;

        return true;
    });
  }, [donors, searchQuery, locationFilter]);

  // --- Analytics Calculations ---
  const stats = useMemo(() => {
      const totalCount = filteredDonors.length;
      const totalAmount = filteredDonors.reduce((sum, d) => sum + (d.amount || 0), 0);
      
      const gender = {
          male: { count: 0, amount: 0 },
          female: { count: 0, amount: 0 },
          other: { count: 0, amount: 0 }
      };

      const professions: Record<string, { count: number, amount: number }> = {};
      PROFESSIONS.forEach(p => professions[p] = { count: 0, amount: 0 });

      filteredDonors.forEach(d => {
          // Gender
          const g = (d.gender || 'Others').toLowerCase();
          if (g === 'male') { gender.male.count++; gender.male.amount += d.amount; }
          else if (g === 'female') { gender.female.count++; gender.female.amount += d.amount; }
          else { gender.other.count++; gender.other.amount += d.amount; }

          // Profession
          const p = d.profession || 'Others';
          if (!professions[p]) professions[p] = { count: 0, amount: 0 }; // Handle unknown professions
          professions[p].count++;
          professions[p].amount += d.amount;
      });

      return { totalCount, totalAmount, gender, professions };
  }, [filteredDonors]);

  // --- Pagination ---
  const totalItems = filteredDonors.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const paginatedDonors = filteredDonors.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // --- Dropdown Options ---
  const states = Object.keys(locations).sort();
  const districts = locationFilter.state ? Object.keys(locations[locationFilter.state] || {}).sort() : [];
  const towns = locationFilter.district ? Object.keys(locations[locationFilter.state]?.[locationFilter.district] || {}).sort() : [];

  const handleLocationChange = (key: keyof typeof locationFilter, val: string) => {
      setLocationFilter(prev => {
          const next = { ...prev, [key]: val };
          if (key === 'state') { next.district = ''; next.town = ''; }
          if (key === 'district') { next.town = ''; }
          return next;
      });
      setCurrentPage(1);
  };

  return (
    <div className="space-y-6 pb-20 max-w-full animate-in fade-in duration-300">
      
      {/* --- Detail Modal --- */}
      {selectedDonor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedDonor(null)}></div>
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
                   <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white shrink-0">
                       <div>
                           <h3 className="text-xl font-bold">Donor Profile</h3>
                           <p className="text-indigo-100 text-xs opacity-90 font-mono mt-0.5">ID: {selectedDonor.id}</p>
                       </div>
                       <button onClick={() => setSelectedDonor(null)} className="text-indigo-200 hover:text-white p-1 rounded-full hover:bg-indigo-500/50 transition-colors">
                           <X size={20} />
                       </button>
                   </div>
                   
                   <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                        {/* Personal Info */}
                        <div className="flex items-start gap-4">
                            <div className="h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-2xl font-bold border-2 border-white shadow-sm shrink-0">
                                {selectedDonor.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-slate-800">{selectedDonor.name}</h4>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded flex items-center"><User size={10} className="mr-1"/> {selectedDonor.gender}</span>
                                    <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded flex items-center"><Briefcase size={10} className="mr-1"/> {selectedDonor.profession}</span>
                                </div>
                                <div className="mt-2 space-y-1">
                                    <p className="text-sm text-slate-600 flex items-center"><Phone size={12} className="mr-2 text-slate-400"/> {selectedDonor.phone}</p>
                                    {selectedDonor.email && <p className="text-sm text-slate-600 flex items-center"><Mail size={12} className="mr-2 text-slate-400"/> {selectedDonor.email}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Financials */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                <label className="text-[10px] font-bold text-emerald-600 uppercase">Donation Amount</label>
                                <p className="text-xl font-bold text-emerald-700">₹{selectedDonor.amount.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Payment Mode</label>
                                <p className="text-sm font-bold text-slate-700 mt-1">{selectedDonor.paymentMode || 'Offline'}</p>
                            </div>
                        </div>

                        {/* Extended Details */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h5 className="text-xs font-bold text-slate-500 uppercase">Additional Information</h5>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="block text-xs text-slate-400 mb-0.5">Receipt Number</span>
                                    <span className="font-mono font-medium text-slate-700">{selectedDonor.receiptNumber || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-slate-400 mb-0.5">Book Number</span>
                                    <span className="font-mono font-medium text-indigo-600">{selectedDonor.bookNumber}</span>
                                </div>
                                {(selectedDonor.idProofType) && (
                                    <div className="col-span-2">
                                        <span className="block text-xs text-slate-400 mb-0.5">{selectedDonor.idProofType}</span>
                                        <span className="font-mono font-medium text-slate-700">{selectedDonor.idProofNumber}</span>
                                    </div>
                                )}
                                <div className="col-span-2">
                                    <span className="block text-xs text-slate-400 mb-0.5">Address</span>
                                    <span className="font-medium text-slate-700">{selectedDonor.address || `${selectedDonor.town}, ${selectedDonor.district}`}</span>
                                </div>
                            </div>
                        </div>
                   </div>
                   
                   <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                       <button onClick={() => setSelectedDonor(null)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 shadow-sm">Close</button>
                   </div>
              </div>
          </div>
      )}

      {/* --- Page Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Donor Tracking</h2>
           <p className="text-slate-500 text-sm mt-1">Analytics and details of all contributors.</p>
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

      {/* --- Filters Section --- */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2"><Filter size={18} className="text-indigo-600"/> Filters</h3>
              <button 
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                  <RefreshCw size={12} /> Reset
              </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Search</label>
                  <div className="relative">
                      <input 
                          type="text" 
                          placeholder="Name, Phone, ID..." 
                          value={searchQuery}
                          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                          className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                      />
                      <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                  </div>
              </div>
              
              <SearchableSelect 
                  label="State" 
                  value={locationFilter.state} 
                  options={states} 
                  onChange={(val) => handleLocationChange('state', val)} 
                  placeholder="All States"
              />
              <SearchableSelect 
                  label="District" 
                  value={locationFilter.district} 
                  options={districts} 
                  onChange={(val) => handleLocationChange('district', val)} 
                  placeholder="All Districts"
                  disabled={!locationFilter.state}
              />
              <SearchableSelect 
                  label="Town / Mandal" 
                  value={locationFilter.town} 
                  options={towns} 
                  onChange={(val) => handleLocationChange('town', val)} 
                  placeholder="All Towns"
                  disabled={!locationFilter.district}
              />
          </div>
      </div>

      {/* --- Analytics Cards --- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* Column 1: High Level Stats */}
          <div className="lg:col-span-1 space-y-4">
              <KPIBox 
                  title="Total Donors" 
                  count={stats.totalCount} 
                  amount={stats.totalAmount} 
                  icon={User} 
                  colorClass="text-blue-600" 
                  bgClass="bg-blue-50" 
              />
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Gender Demographics</h4>
                  <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 rounded bg-indigo-50/50">
                          <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                              <span className="text-xs font-bold text-slate-700">Male</span>
                          </div>
                          <div className="text-right">
                              <span className="block text-xs font-bold text-indigo-700">{stats.gender.male.count}</span>
                              <span className="block text-[10px] text-slate-500">₹{stats.gender.male.amount.toLocaleString()}</span>
                          </div>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-pink-50/50">
                          <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                              <span className="text-xs font-bold text-slate-700">Female</span>
                          </div>
                          <div className="text-right">
                              <span className="block text-xs font-bold text-pink-700">{stats.gender.female.count}</span>
                              <span className="block text-[10px] text-slate-500">₹{stats.gender.female.amount.toLocaleString()}</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* Column 2-4: Profession Grid */}
          <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><Briefcase size={14}/> Profession Breakdown</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {Object.entries(stats.professions).map(([prof, data]) => (
                      <ProfessionCard key={prof} profession={prof} count={data.count} amount={data.amount} />
                  ))}
              </div>
          </div>
      </div>

      {/* --- Data Table --- */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
              {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                       <Loader2 className="animate-spin mb-2" size={32} />
                       <span className="text-sm">Loading Donor Data...</span>
                   </div>
              ) : (
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 font-bold text-slate-500 uppercase text-xs border-b border-slate-200">
                          <tr>
                              <th className="px-6 py-4">Donor Name</th>
                              <th className="px-6 py-4">Contact</th>
                              <th className="px-6 py-4">Location</th>
                              <th className="px-6 py-4">Profession</th>
                              <th className="px-6 py-4 text-right">Amount</th>
                              <th className="px-6 py-4 text-center">Action</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {paginatedDonors.length === 0 ? (
                              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No donors found matching criteria.</td></tr>
                          ) : (
                              paginatedDonors.map(d => (
                                  <tr key={d.id} className="hover:bg-slate-50 transition-colors group">
                                      <td className="px-6 py-4">
                                          <p className="font-bold text-slate-800">{d.name}</p>
                                          <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase">ID: {d.receiptNumber || 'N/A'}</p>
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="flex flex-col gap-0.5">
                                              <span className="text-slate-600 flex items-center text-xs"><Phone size={10} className="mr-1.5 text-slate-400"/> {d.phone}</span>
                                              {d.email && <span className="text-slate-500 flex items-center text-xs"><Mail size={10} className="mr-1.5 text-slate-400"/> {d.email}</span>}
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 text-xs text-slate-600">
                                          <span className="block font-medium">{d.town}</span>
                                          <span className="text-slate-400">{d.district}</span>
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                              {d.profession || 'N/A'}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-right font-bold text-emerald-600">₹{d.amount.toLocaleString()}</td>
                                      <td className="px-6 py-4 text-center">
                                          <button 
                                            onClick={() => setSelectedDonor(d)}
                                            className="text-indigo-600 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 rounded transition-colors"
                                            title="View Details"
                                          >
                                              <Eye size={18} />
                                          </button>
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              )}
          </div>

          {/* Pagination */}
           {totalItems > 0 && (
               <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                   <div className="text-xs text-slate-500">
                       Page <span className="font-bold">{currentPage}</span> of {totalPages} ({totalItems} records)
                   </div>
                   <div className="flex gap-2">
                       <button 
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="p-2 bg-white border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-100 transition-colors"
                       >
                           <ChevronLeft size={16} />
                       </button>
                       <button 
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 bg-white border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-100 transition-colors"
                       >
                           <ChevronRight size={16} />
                       </button>
                   </div>
               </div>
           )}
      </div>
    </div>
  );
};

export default DonorTracking;
