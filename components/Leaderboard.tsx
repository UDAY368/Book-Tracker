
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, Search, MapPin, User, ChevronLeft, ChevronRight, 
  Eye, Filter, Award, Medal, Crown, Phone, Briefcase, BookOpen, X, IndianRupee, FileText, CheckCircle
} from 'lucide-react';
import { api } from '../services/api';

// --- Types ---
type LeaderboardTab = 'Donor' | 'Recipient' | 'All' | 'Individual' | 'Center' | 'District' | 'Autonomous';

interface LeaderboardItem {
  id: string;
  type: string; // Donor or Incharge Type
  typeName?: string; // Center Name etc.
  name: string;
  contact: string;
  email?: string;
  profession?: string;
  location?: string;
  amount: number;
  totalBooks?: number;
  totalDonors?: number; // Added for Recipient view
  rank?: number;
  // Extra fields for donor modal
  gender?: string;
  idProofType?: string;
  idProofNumber?: string;
  paymentMode?: string;
  transactionId?: string;
  checkNumber?: string;
}

// --- Icons ---
const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown className="text-yellow-500 fill-yellow-100" size={24} />;
  if (rank === 2) return <Medal className="text-slate-400 fill-slate-100" size={24} />;
  if (rank === 3) return <Medal className="text-amber-700 fill-amber-100" size={24} />;
  return <span className="font-bold text-slate-500 w-6 text-center block">{rank}</span>;
};

// --- Reusable Searchable Select ---
const FilterDropdown = ({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder,
  disabled = false
}: { label: string, value: string, options: string[], onChange: (val: string) => void, placeholder: string, disabled?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  
  useEffect(() => { setFilter(value); }, [value]);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="relative min-w-[180px] flex-1">
      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{label}</label>
      <div className="relative">
          <input
              type="text"
              value={filter} 
              onClick={() => !disabled && setIsOpen(!isOpen)}
              onChange={(e) => {
                  setFilter(e.target.value);
                  onChange(e.target.value); 
                  setIsOpen(true);
              }}
              disabled={disabled}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm disabled:bg-slate-50 disabled:text-slate-400 transition-all font-medium"
              placeholder={placeholder}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          />
          {isOpen && filteredOptions.length > 0 && (
              <ul className="absolute z-50 mt-1 w-full bg-white shadow-xl max-h-60 rounded-lg py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none custom-scrollbar border border-slate-100">
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
    </div>
  );
};

// --- Main Component ---
const Leaderboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('Donor');
  const [data, setData] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [locationData, setLocationData] = useState<any>({});
  const [filters, setFilters] = useState({ state: '', district: '', town: '' });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Modal
  const [selectedDonor, setSelectedDonor] = useState<LeaderboardItem | null>(null);

  // Derived Dropdown Options
  const states = useMemo(() => Object.keys(locationData).sort(), [locationData]);
  const districts = useMemo(() => filters.state ? Object.keys(locationData[filters.state] || {}).sort() : [], [filters.state, locationData]);
  const towns = useMemo(() => filters.district ? Object.keys(locationData[filters.state]?.[filters.district] || {}).sort() : [], [filters.district, locationData]);

  useEffect(() => {
    const init = async () => {
        const loc = await api.getLocations();
        setLocationData(loc);
    };
    init();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab, filters]); // Fetch on tab or filter change

  const fetchData = async () => {
      setLoading(true);
      try {
          const result = await api.getLeaderboardData({ 
              type: activeTab, 
              state: filters.state, 
              district: filters.district, 
              town: filters.town 
          });
          setData(result);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  // --- Filtering & Pagination ---
  const processedData = useMemo(() => {
      let filtered = data;
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(item => 
              item.name.toLowerCase().includes(q) || 
              item.contact.includes(q) ||
              (item.typeName && item.typeName.toLowerCase().includes(q))
          );
      }
      return filtered.map((item, idx) => ({ ...item, rank: idx + 1 })); // Assign rank based on sort order (API returns sorted DESC)
  }, [data, searchQuery]);

  const totalItems = processedData.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const paginatedData = processedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const totalCollection = useMemo(() => data.reduce((sum, item) => sum + item.amount, 0), [data]);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      {/* Donor Details Modal */}
      {selectedDonor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedDonor(null)}></div>
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                   <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white flex justify-between items-start shrink-0">
                       <div>
                           <h3 className="text-xl font-bold">{selectedDonor.type === 'Recipient' ? 'Recipient Details' : 'Donor Details'}</h3>
                           <p className="text-indigo-100 text-sm mt-1 opacity-90">Contribution Overview</p>
                       </div>
                       <button onClick={() => setSelectedDonor(null)} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full transition-colors">
                           <X size={20} />
                       </button>
                   </div>
                   
                   <div className="p-6 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl border border-indigo-100">
                                {selectedDonor.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-slate-800">{selectedDonor.name}</h4>
                                <div className="flex items-center text-sm text-slate-500 gap-3 mt-1">
                                    <span className="flex items-center gap-1"><Phone size={12}/> {selectedDonor.contact}</span>
                                    {selectedDonor.gender && <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{selectedDonor.gender}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Amount</label>
                                <p className="text-xl font-bold text-emerald-600">₹{selectedDonor.amount.toLocaleString()}</p>
                            </div>
                            <div>
                                {selectedDonor.type === 'Recipient' ? (
                                    <>
                                        <label className="text-xs font-bold text-slate-400 uppercase">Total Donors</label>
                                        <p className="text-sm font-bold text-slate-700">{selectedDonor.totalDonors || 0}</p>
                                    </>
                                ) : (
                                    <>
                                        <label className="text-xs font-bold text-slate-400 uppercase">Profession</label>
                                        <p className="text-sm font-bold text-slate-700">{selectedDonor.profession || 'N/A'}</p>
                                    </>
                                )}
                            </div>
                            {selectedDonor.paymentMode && (
                                <div className="col-span-2 pt-2 border-t border-slate-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500 uppercase">{selectedDonor.paymentMode}</span>
                                        {selectedDonor.transactionId && <span className="font-mono text-xs bg-white px-2 py-1 border rounded">{selectedDonor.transactionId}</span>}
                                        {selectedDonor.checkNumber && <span className="font-mono text-xs bg-white px-2 py-1 border rounded">Chk: {selectedDonor.checkNumber}</span>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {(selectedDonor.idProofType || selectedDonor.location) && (
                            <div className="space-y-3">
                                {selectedDonor.idProofType && (
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-sm text-slate-500 font-medium">{selectedDonor.idProofType}</span>
                                        <span className="text-sm text-slate-800 font-bold font-mono">{selectedDonor.idProofNumber}</span>
                                    </div>
                                )}
                                {selectedDonor.location && (
                                    <div className="flex items-start gap-2">
                                        <MapPin size={16} className="text-slate-400 mt-0.5" />
                                        <span className="text-sm text-slate-600">{selectedDonor.location}</span>
                                    </div>
                                )}
                            </div>
                        )}
                   </div>
                   <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
                      <button onClick={() => setSelectedDonor(null)} className="px-5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100 shadow-sm transition-colors">Close</button>
                   </div>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between lg:items-end gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-yellow-100 text-yellow-700 rounded-lg"><Trophy size={24} /></div>
               <h2 className="text-2xl font-bold text-slate-800">Donation Leaderboard</h2>
           </div>
           <p className="text-slate-500 text-sm max-w-xl">Top contributors and incharges driving the mission forward.</p>
        </div>
        <div className="text-right bg-emerald-50 p-4 rounded-xl border border-emerald-100 min-w-[200px]">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Total in View</p>
            <p className="text-2xl font-bold text-emerald-700">₹{totalCollection.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          {/* Location Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2 md:mb-3 mr-2">
                  <Filter size={16} className="text-indigo-600"/>
                  <span>Filters</span>
              </div>
              <FilterDropdown 
                  label="State" 
                  placeholder="Select State" 
                  value={filters.state} 
                  options={states} 
                  onChange={(val) => setFilters({ state: val, district: '', town: '' })} 
              />
              <FilterDropdown 
                  label="District" 
                  placeholder="Select District" 
                  value={filters.district} 
                  options={districts} 
                  onChange={(val) => setFilters(prev => ({ ...prev, district: val, town: '' }))} 
                  disabled={!filters.state}
              />
              <FilterDropdown 
                  label="Town / Mandal" 
                  placeholder="Select Town" 
                  value={filters.town} 
                  options={towns} 
                  onChange={(val) => setFilters(prev => ({ ...prev, town: val }))} 
                  disabled={!filters.district}
              />
              {(filters.state || filters.district || filters.town) && (
                  <button 
                    onClick={() => setFilters({ state: '', district: '', town: '' })}
                    className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors mb-0.5"
                  >
                      Clear
                  </button>
              )}
          </div>

          {/* Type Chips */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
              {['Donor', 'Recipient', 'All', 'Individual', 'Center', 'District', 'Autonomous'].map((tab) => (
                  <button
                      key={tab}
                      onClick={() => { setActiveTab(tab as LeaderboardTab); setCurrentPage(1); }}
                      className={`
                          px-4 py-1.5 rounded-full text-sm font-bold transition-all border
                          ${activeTab === tab 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-100' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                          }
                      `}
                  >
                      {tab === 'Autonomous' ? 'Autonomous Body' : tab}
                  </button>
              ))}
          </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input 
              type="text" 
              placeholder="Search Name, Phone..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
          />
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex-1 overflow-auto">
              <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                      <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-16">Rank</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                              {activeTab === 'Donor' ? 'Donor Name' : activeTab === 'Recipient' ? 'Recipient Name' : 'Incharge Name'}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                              {activeTab === 'Recipient' ? 'Phone Number' : 'Contact'}
                          </th>
                          
                          {activeTab === 'Donor' ? (
                              <>
                                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Profession</th>
                                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                              </>
                          ) : activeTab === 'Recipient' ? (
                              <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Total Donors</th>
                          ) : (
                              <>
                                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Entity Name</th>
                                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Books</th>
                              </>
                          )}
                          
                          <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                              {activeTab === 'Recipient' ? 'Donation Amount' : 'Amount'}
                          </th>
                          
                          {(activeTab === 'Donor' || activeTab === 'Recipient') && (
                              <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                          )}
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                      {loading ? (
                          <tr><td colSpan={8} className="px-6 py-20 text-center text-slate-400">Loading Leaderboard...</td></tr>
                      ) : paginatedData.length === 0 ? (
                          <tr><td colSpan={8} className="px-6 py-20 text-center text-slate-400 italic">No records found matching criteria.</td></tr>
                      ) : (
                          paginatedData.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center justify-center bg-slate-50 w-8 h-8 rounded-full border border-slate-100 group-hover:bg-white transition-colors">
                                          <RankIcon rank={item.rank!} />
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="text-sm font-bold text-slate-800">{item.name}</span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center text-sm text-slate-600 gap-1">
                                          <Phone size={12} className="text-slate-400"/> {item.contact}
                                      </div>
                                  </td>

                                  {activeTab === 'Donor' ? (
                                      <>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                                  {item.profession || 'N/A'}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                              <span className="flex items-center gap-1 max-w-[150px] truncate" title={item.location}>
                                                  <MapPin size={12} className="text-slate-300"/> {item.location || '-'}
                                              </span>
                                          </td>
                                      </>
                                  ) : activeTab === 'Recipient' ? (
                                      <td className="px-6 py-4 whitespace-nowrap text-center">
                                          <span className="text-sm font-bold text-slate-600">{item.totalDonors || 0}</span>
                                      </td>
                                  ) : (
                                      <>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                                  item.type === 'Individual' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                  item.type === 'Center' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                  'bg-amber-50 text-amber-700 border-amber-200'
                                              }`}>
                                                  {item.type}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                                              {item.typeName || '-'}
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-slate-600">
                                              {item.totalBooks}
                                          </td>
                                      </>
                                  )}

                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                      <span className="text-sm font-bold text-emerald-600">₹{item.amount.toLocaleString()}</span>
                                  </td>
                                  
                                  {(activeTab === 'Donor' || activeTab === 'Recipient') && (
                                      <td className="px-6 py-4 whitespace-nowrap text-center">
                                          <button 
                                              onClick={() => setSelectedDonor(item)}
                                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                              title="View Details"
                                          >
                                              <Eye size={18} />
                                          </button>
                                      </td>
                                  )}
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
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
                          className="p-2 bg-white border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-100"
                       >
                           <ChevronLeft size={16} />
                       </button>
                       <button 
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 bg-white border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-100"
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

export default Leaderboard;
