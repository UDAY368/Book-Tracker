
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight, X, 
  User, Phone, IndianRupee, MapPin, RefreshCw, Loader2,
  Users, Eye, Download, FileText, ChevronDown, BookOpen
} from 'lucide-react';
import { api } from '../services/api';
import { ReceiverBook } from '../types';

// --- Helper Components ---

const StatCard = ({ title, value, icon: Icon, colorClass, bgClass, subtext }: { title: string, value: string | number, icon: any, colorClass: string, bgClass: string, subtext?: string }) => (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center h-full hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
            </div>
            <div className={`p-2.5 rounded-lg ${bgClass} ${colorClass}`}>
                <Icon size={20} />
            </div>
        </div>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
);

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
      <label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>
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
              className="block w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm disabled:bg-slate-50 disabled:text-slate-400 transition-all font-medium text-slate-800 placeholder-slate-400"
              placeholder={placeholder}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
              autoComplete="off"
          />
          
          {!disabled && value && (
             <button 
                type="button"
                onClick={(e) => { 
                    e.stopPropagation(); 
                    onChange(''); 
                    setFilter(''); 
                }}
                className="absolute right-8 top-2.5 text-slate-400 hover:text-red-500 transition-colors z-10"
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

const RecipientTracking: React.FC = () => {
  const [books, setBooks] = useState<ReceiverBook[]>([]);
  const [locations, setLocations] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState({ state: '', district: '', town: '' });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Modals
  const [selectedBook, setSelectedBook] = useState<ReceiverBook | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [booksData, locData] = await Promise.all([
        api.getReceiverBooks(),
        api.getLocations()
      ]);
      
      // Filter for books that have been registered (have a recipient)
      const recipientBooks = booksData.filter(b => 
        b.status !== 'Distributed' && b.assignedToName && b.assignedToName !== 'Unknown'
      );
      
      setBooks(recipientBooks);
      setLocations(locData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Filtering Logic ---
  const filteredData = useMemo(() => {
    return books.filter(item => {
      // 1. Text Search
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        item.bookNumber.toLowerCase().includes(q) ||
        item.assignedToName.toLowerCase().includes(q) ||
        (item.assignedToPhone && item.assignedToPhone.includes(q));
      
      if (!matchesSearch) return false;

      // 2. Location Filter
      if (locationFilter.state && item.state !== locationFilter.state) return false;
      if (locationFilter.district && item.district !== locationFilter.district) return false;
      if (locationFilter.town && item.town !== locationFilter.town) return false;

      return true;
    });
  }, [books, searchQuery, locationFilter]);

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    const totalAmount = filteredData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    // Count unique recipients by Name + Phone to approximate uniqueness
    const uniqueRecipients = new Set(filteredData.map(b => `${b.assignedToName}-${b.assignedToPhone}`)).size;
    const totalDonors = filteredData.reduce((sum, item) => sum + (item.filledPages || 0), 0);
    
    return { totalAmount, uniqueRecipients, totalDonors };
  }, [filteredData]);

  // --- Pagination Logic ---
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // --- Location Dropdown Options ---
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
    <div className="space-y-6 pb-20 max-w-7xl mx-auto animate-in fade-in duration-300">
        
        {/* Detail Modal */}
        {selectedBook && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedBook(null)}></div>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                    <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
                        <h3 className="font-bold text-lg">Recipient Details</h3>
                        <button onClick={() => setSelectedBook(null)} className="text-indigo-200 hover:text-white p-1 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                                <User size={24} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Recipient Name</label>
                                <p className="text-lg font-bold text-slate-900">{selectedBook.assignedToName}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Book Number</label>
                                <p className="text-sm font-mono font-bold text-indigo-600 bg-indigo-50 inline-block px-2 py-0.5 rounded">{selectedBook.bookNumber}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Phone</label>
                                <p className="text-sm font-medium text-slate-700">{selectedBook.assignedToPhone}</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Location</label>
                            <div className="flex items-start gap-1.5 mt-1 text-sm text-slate-700">
                                <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                <span>
                                    {selectedBook.town}, {selectedBook.district}, {selectedBook.state}
                                    {selectedBook.address && <span className="block text-xs text-slate-500 mt-1">{selectedBook.address}</span>}
                                </span>
                            </div>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex justify-between items-center">
                            <div>
                                <label className="text-xs font-bold text-emerald-600 uppercase">Total Collected</label>
                                <p className="text-xl font-bold text-emerald-700">₹{selectedBook.totalAmount.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <label className="text-xs font-bold text-emerald-600 uppercase">Donors</label>
                                <p className="text-sm font-bold text-emerald-700">{selectedBook.filledPages} / {selectedBook.totalPages}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
                        <button onClick={() => setSelectedBook(null)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 shadow-sm">Close</button>
                    </div>
                </div>
            </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Recipient Tracking</h2>
                <p className="text-slate-500 text-sm mt-1">Track book recipients and collected donations.</p>
            </div>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
                title="Total Recipients" 
                value={stats.uniqueRecipients} 
                icon={Users} 
                bgClass="bg-indigo-50" 
                colorClass="text-indigo-600" 
                subtext="Unique Individuals"
            />
            <StatCard 
                title="Total Books" 
                value={totalItems} 
                icon={BookOpen} 
                bgClass="bg-blue-50" 
                colorClass="text-blue-600" 
            />
            <StatCard 
                title="Total Donors" 
                value={stats.totalDonors} 
                icon={User} 
                bgClass="bg-amber-50" 
                colorClass="text-amber-600" 
                subtext="Filled Pages"
            />
            <StatCard 
                title="Total Amount" 
                value={`₹${stats.totalAmount.toLocaleString()}`} 
                icon={IndianRupee} 
                bgClass="bg-emerald-50" 
                colorClass="text-emerald-600" 
            />
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col">
            
            {/* Filters */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><Filter size={18} className="text-indigo-600"/> Filter Recipients</h3>
                    {(locationFilter.state || locationFilter.district || locationFilter.town || searchQuery) && (
                        <button 
                            onClick={() => { setLocationFilter({state:'', district:'', town:''}); setSearchQuery(''); }}
                            className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors"
                        >
                            <RefreshCw size={12} /> Reset
                        </button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Search</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search Name, Phone, Book..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                            />
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        </div>
                    </div>
                    
                    <SearchableSelect 
                        label="State" 
                        value={locationFilter.state} 
                        options={states} 
                        onChange={(val) => handleLocationChange('state', val)} 
                        placeholder="Select State"
                    />
                    <SearchableSelect 
                        label="District" 
                        value={locationFilter.district} 
                        options={districts} 
                        onChange={(val) => handleLocationChange('district', val)} 
                        placeholder="Select District"
                        disabled={!locationFilter.state}
                    />
                    <SearchableSelect 
                        label="Town / Mandal" 
                        value={locationFilter.town} 
                        options={towns} 
                        onChange={(val) => handleLocationChange('town', val)} 
                        placeholder="Select Town"
                        disabled={!locationFilter.district}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <Loader2 className="animate-spin mb-2" size={32} />
                        <span className="text-sm">Loading Data...</span>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Book Number</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Recipient Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Total Donors</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Donation Amount</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {paginatedData.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No recipients found matching filters.</td></tr>
                            ) : (
                                paginatedData.map((book) => (
                                    <tr key={book.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-sm">{book.bookNumber}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                                                    {book.assignedToName.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold text-slate-800">{book.assignedToName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
                                                <Phone size={14} className="text-slate-400" />
                                                {book.assignedToPhone || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="text-sm font-medium text-slate-700">{book.filledPages || 0}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="text-sm font-bold text-emerald-600">₹{(book.totalAmount || 0).toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button 
                                                onClick={() => setSelectedBook(book)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
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

export default RecipientTracking;
